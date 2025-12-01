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

// Segurança
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');

// Performance e Logging (com fallback se não instalados)
let compression, morgan, slowDown, logger;
try {
  compression = require('compression');
  morgan = require('morgan');
  slowDown = require('express-slow-down');
  logger = require('./config/logger');
} catch (e) {
  // Fallback para console se pacotes não estiverem instalados
  logger = console;
}

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

const missingVars = [];
if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) missingVars.push('DATABASE_URL/POSTGRES_URL');
if (missingVars.length) {
  logger.warn(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
}

// Validar JWT_SECRET em produção
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('troque')) {
    logger.error('ERRO CRÍTICO: JWT_SECRET inválido ou inseguro em produção!');
    logger.error('JWT_SECRET deve ter pelo menos 32 caracteres e não conter valores padrão.');
    process.exit(1);
  }
  logger.info('JWT_SECRET validado com sucesso');
}

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
const trustProxyEnv = process.env.TRUST_PROXY;
let trustProxyConfig = false;
if (isProd) {
  if (trustProxyEnv === 'true') trustProxyConfig = 1;
  else if (trustProxyEnv === 'false' || !trustProxyEnv) trustProxyConfig = false;
  else trustProxyConfig = trustProxyEnv; // aceita 'loopback', '127.0.0.1', lista, etc.
}
app.set('trust proxy', trustProxyConfig);

app.use((req, res, next) => { next(); });

// Endurecimento básico (antes de rotas)
app.use(helmet());
const gaEnabled = !!process.env.REACT_APP_GA_MEASUREMENT_ID || !!process.env.GA_MEASUREMENT_ID;
const cspScriptSrc = ["'self'"];
const cspConnectSrc = ["'self'", 'https:', 'wss:', 'ws:'];
if (gaEnabled) {
  cspScriptSrc.push('https://www.googletagmanager.com', "'unsafe-inline'");
  cspConnectSrc.push('https://www.google-analytics.com');
}
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://images.unsplash.com',
        'https://randomuser.me',
        'https://via.placeholder.com'
      ],
      connectSrc: ["'self'", 'https:', 'wss:', 'ws:', 'http://localhost:5001', 'http://127.0.0.1:5001'],
      scriptSrc: cspScriptSrc,
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: []
    },
  })
);
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy({ policy: 'same-site' }));
app.use((req, res, next) => { res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()'); next(); });
app.use(hpp());
app.use(mongoSanitize());
// Sanitização de entrada (substitui xss-clean)
const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style', 'iframe'] };
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

// CORS: whitelist mesmo em desenvolvimento para maior segurança
const devOrigins = ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5001'];
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
const prodOrigins = allowedOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean);
const allowedOrigins = process.env.NODE_ENV === 'production' ? prodOrigins : devOrigins;

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requisições sem origin (ex: curl, mobile apps)
      if (!origin) return callback(null, true);

      // Em produção sem ALLOWED_ORIGINS configurado, bloquear tudo
      if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
        logger.warn(`CORS bloqueado: nenhuma origem configurada em produção`);
        return callback(new Error('CORS não configurado'));
      }

      // Verificar whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS bloqueado para origem: ${origin}`);
      return callback(new Error('Origem não permitida pela política de CORS'));
    },
    credentials: true,
  })
);

// Body parsers com limite (mitiga DoS por payload)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Compressão gzip (se disponível)
if (compression) {
  app.use(compression());
  logger.info('Compressão gzip ativada');
}

// HTTP request logger (se disponível)
if (morgan && logger.stream) {
  const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, { stream: logger.stream }));
  logger.info('Morgan HTTP logger ativado');
}

// Auditoria simples de acesso (IP mascarado)
app.use((req, res, next) => {
  const realIP = getRequestIP(req);
  const maskedIP = maskIP(realIP);
  const timestamp = new Date().toISOString();
  // Usar logger se disponível, senão console
  if (logger.http) {
    logger.http(`Acesso de IP: ${maskedIP} - ${req.method} ${req.path}`);
  } else {
    console.log(`[${timestamp}] Acesso de IP: ${maskedIP} - ${req.method} ${req.path}`.cyan);
  }
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
  logger.error('Não foi possível criar pasta de logs:', e.message);
}

// Função para mascarar email em logs
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return 'N/A';
  const [user, domain] = email.split('@');
  if (!user || !domain) return 'N/A';
  return `${user.slice(0, 2)}***@${domain}`;
};

// Auditoria de tentativas de autenticação (formato unificado)
app.use((req, res, next) => {
  const isLogin = req.path.includes('/api/users/login') || req.path.includes('/api/users/technician-login');
  const isRegister = req.path === '/api/users' && req.method === 'POST';
  const isAuthRoute = isLogin || isRegister;
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
        event: isRegister
          ? (res.statusCode >= 200 && res.statusCode < 400 ? 'REGISTER' : 'REGISTER_FAILED')
          : (res.statusCode >= 200 && res.statusCode < 400 ? 'LOGIN' : 'LOGIN_FAILED'),
        user: { email: maskEmail(email) }, // Email mascarado para segurança
        connection: {
          ip: maskedIP,
          userAgent: ua,
          method: req.method,
          path: req.path
        },
        success: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode
      };
      fs.appendFile(path.join(logsDir, 'login-audit.log'), JSON.stringify(entry) + '\n', () => { });
    } catch (err) {
      logger.error('Falha ao gravar log de login:', err?.message || err);
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

// Slow down para login (desacelera antes de bloquear)
if (slowDown) {
  const loginSpeedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 3,
    delayMs: 500
  });
  app.use('/api/users/login', loginSpeedLimiter);
  app.use('/api/users/technician-login', loginSpeedLimiter);
  logger.info('Slow-down ativado para rotas de login');
}

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

// Rate limiters para rotas sensíveis
const ticketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Muitas requisições de tickets. Tente novamente mais tarde.'
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Muitos uploads. Tente novamente mais tarde.'
});

app.use('/api/tickets', ticketLimiter);
app.use('/api/uploads', uploadLimiter);
app.use('/api/payments', ticketLimiter);

logger.info('Rate limiting configurado para todas as rotas sensíveis');

// Rotas da API
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/technicians', require('./routes/technicianRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));

// Utilidades: CEP (proxy ViaCEP)
app.get('/api/cep/:cep', async (req, res) => {
  try {
    const cep = String(req.params.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return res.status(400).json({ error: 'CEP inválido' });
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await resp.json();
    if (!data || data.erro) return res.status(404).json({ error: 'CEP não encontrado' });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao consultar CEP' });
  }
});

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
const buildIndex = path.join(frontendBuildPath, 'index.html');
if (fs.existsSync(buildIndex)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(buildIndex);
  });
} else {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.status(200).send('<!doctype html><html><head><meta charset="utf-8"><title>Servidor online</title></head><body><h1>Servidor online</h1><p>Build do frontend ausente. Execute <code>npm run build --prefix frontend</code> ou aguarde o deploy concluir.</p></body></html>');
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
// Removido o fallback "OK" para não mascarar a SPA
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
});
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});