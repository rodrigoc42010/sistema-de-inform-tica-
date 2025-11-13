const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Middleware/Utils
const { errorHandler } = require('./middleware/errorMiddleware');
const { maskIP, getRequestIP } = require('./middleware/auditLogger');
const connectDB = require('./config/db');

// OAuth
// Removido: autenticação social via Google/Microsoft
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const MicrosoftStrategy = require('passport-microsoft').Strategy;
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

// Segurança
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao banco de dados (mas continuar mesmo se falhar)
let dbConnected = false;
connectDB().then((connected) => {
  dbConnected = connected;
});

const app = express();

// Configurações básicas de servidor
app.disable('x-powered-by');
// Em desenvolvimento, desativar 'trust proxy' para evitar validação do express-rate-limit.
// Em produção, permitir configuração via variável de ambiente (lista ou booleano).
const isProd = process.env.NODE_ENV === 'production';
const trustProxyConfig = isProd ? (process.env.TRUST_PROXY || false) : false;
app.set('trust proxy', trustProxyConfig);

// Cabeçalhos de segurança + compatibilidade com antivírus (uma única vez)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // CSP relaxada por compatibilidade; fortalecer em produção conforme front
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' ws: wss:;"
  );
  // Headers específicos para Kaspersky
  res.setHeader('X-Kaspersky-Safe', 'true');
  res.setHeader('X-Antivirus-Safe', 'verified');
  next();
});

// Endurecimento básico (antes de rotas)
app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());
// Sanitização de entrada (substitui xss-clean)
const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script','style','iframe'] };
const sanitizeString = (s) => (typeof s === 'string' ? xss(s, xssOptions) : s);
const deepSanitize = (val) => {
  if (val == null) return val;
  if (typeof val === 'string') return sanitizeString(val);
  if (Array.isArray(val)) return val.map(deepSanitize);
  if (typeof val === 'object') {
    for (const k of Object.keys(val)) val[k] = deepSanitize(val[k]);
    return val;
  }
  return val;
};
app.use((req, res, next) => {
  try {
    if (req.body) req.body = deepSanitize(req.body);
    if (req.query) req.query = deepSanitize(req.query);
    if (req.params) req.params = deepSanitize(req.params);
  } catch (e) {
    console.warn('Falha ao sanitizar entrada:', e.message);
  }
  next();
});

// CORS: liberado em dev; restrito em produção por ALLOWED_ORIGINS (lista separada por vírgula)
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = allowedOriginsEnv
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // ex: curl/mobile
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      return allowedOrigins.includes(origin)
        ? callback(null, true)
        : callback(new Error('Origem não permitida pela política de CORS'));
    },
    credentials: true,
  })
);

// Body parsers com limite (mitiga DoS por payload)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Auditoria simples de acesso (IP mascarado)
app.use((req, res, next) => {
  const realIP = getRequestIP(req);
  const maskedIP = maskIP(realIP);
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Acesso de IP: ${maskedIP} - ${req.method} ${req.path}`.cyan);
  next();
});

// Inicializar Passport (sem sessões)
// Removido: inicialização do Passport para OAuth
// app.use(passport.initialize());

// Removido: estratégias OAuth Google/Microsoft e criação automática de usuários

// Diretório de logs de auditoria
const logsDir = path.join(__dirname, '../logs');
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (e) {
  console.error('Não foi possível criar pasta de logs:', e.message);
}

// Auditoria de tentativas de autenticação (formato unificado)
app.use((req, res, next) => {
  const isAuthRoute = req.path.includes('/api/users/login') || req.path.includes('/api/users/register');
  if (!isAuthRoute) return next();

  const startedAt = new Date().toISOString();
  const ua = req.get('User-Agent');
  const realIP = getRequestIP(req);
  const maskedIP = maskIP(realIP);

  res.on('finish', () => {
    try {
      const email = req.body && typeof req.body.email === 'string' ? req.body.email.slice(0, 200) : undefined;
      const entry = {
        timestamp: startedAt,
        event: res.statusCode >= 200 && res.statusCode < 400 ? 'LOGIN' : 'LOGIN_FAILED',
        user: { email: email || 'N/A' },
        connection: {
          ip: maskedIP,
          userAgent: ua,
          method: req.method,
          path: req.path
        },
        success: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode
      };
      fs.appendFile(path.join(logsDir, 'login-audit.log'), JSON.stringify(entry) + '\n', () => {});
    } catch (err) {
      console.error('Falha ao gravar log de login:', err?.message || err);
    }
  });

  next();
});

// Rate limiter global (aplicar antes das rotas)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiters específicos para autenticação (mitigação de brute force)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/technician-login', authLimiter);
app.use('/api/users/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));

// Rotas da API
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/technicians', require('./routes/technicianRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));

// Rota de status
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    dbConnected,
    message: 'Servidor funcionando corretamente',
    serverTime: new Date().toISOString(),
  });
});

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.get('/google-icon.svg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/google-icon.svg'));
});
app.get('/microsoft-icon.svg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/microsoft-icon.svg'));
});

// Pasta para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir o frontend em produção (SPA)
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Middleware de tratamento de erros (por último)
app.use(errorHandler);

// Configuração de portas
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Servidor HTTP
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor HTTP rodando em ${process.env.NODE_ENV} na porta ${PORT}`.yellow.bold);
});

// Servidor HTTPS (opcional)
(function startHttpsIfAvailable() {
  if (process.env.ENABLE_HTTPS !== 'true') {
    console.warn('HTTPS desativado por configuração (ENABLE_HTTPS != "true").');
    return;
  }
  try {
    const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/key.pem');
    const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../ssl/cert.pem');
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      https.createServer(sslOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`Servidor HTTPS rodando em ${process.env.NODE_ENV} na porta ${HTTPS_PORT}`.green.bold);
        console.log(`Acessível externamente via IP 45.188.152.240 (criptografado)`.green.bold);
        console.log(`URL de acesso: https://45.188.152.240:${HTTPS_PORT}`.cyan.bold);
      });
    } else {
      console.warn(`Certificados SSL não encontrados em ${keyPath} e/ou ${certPath}; HTTPS desativado. Use SSL_KEY_PATH e SSL_CERT_PATH para configurar.`.magenta);
    }
  } catch (e) {
    console.warn(`Falha ao iniciar HTTPS: ${e.message}. Continuando apenas com HTTP.`.magenta);
  }
})();