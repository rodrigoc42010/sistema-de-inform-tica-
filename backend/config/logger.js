const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ===========================
// UTILITÁRIOS DE MASCARAMENTO
// ===========================

/**
 * Mascara email (ex: user@example.com -> u***@example.com)
 */
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user[0]}***@${domain}`;
};

/**
 * Mascara CPF/CNPJ (ex: 123.456.789-00 -> ***.***.789-00)
 */
const maskCpfCnpj = (cpfCnpj) => {
  if (!cpfCnpj || typeof cpfCnpj !== 'string') return cpfCnpj;
  const digits = cpfCnpj.replace(/\D/g, '');
  if (digits.length === 11) {
    // CPF: ***.***.789-00
    return `***.***${digits.slice(6)}`;
  } else if (digits.length === 14) {
    // CNPJ: **.***.***/****-**
    return `**.***.***/****-${digits.slice(-2)}`;
  }
  return '***';
};

/**
 * Mascara telefone (ex: (11) 98765-4321 -> (11) ****-4321)
 */
const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 8) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`;
  }
  return '***';
};

/**
 * Mascara senha (sempre retorna ***)
 */
const maskPassword = () => '***';

/**
 * Mascara IP (ex: 192.168.1.100 -> 192.168.***.***)
 */
const maskIP = (ip) => {
  if (!ip || typeof ip !== 'string') return ip;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  // IPv6 ou outro formato
  return ip.slice(0, 10) + '***';
};

/**
 * Mascara objeto recursivamente
 */
const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const masked = { ...obj };
  const sensitiveKeys = [
    'password',
    'senha',
    'token',
    'secret',
    'apiKey',
    'api_key',
  ];

  for (const key in masked) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      masked[key] = '***';
    } else if (key.toLowerCase().includes('email')) {
      masked[key] = maskEmail(masked[key]);
    } else if (
      key.toLowerCase().includes('cpf') ||
      key.toLowerCase().includes('cnpj')
    ) {
      masked[key] = maskCpfCnpj(masked[key]);
    } else if (
      key.toLowerCase().includes('phone') ||
      key.toLowerCase().includes('telefone')
    ) {
      masked[key] = maskPhone(masked[key]);
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
};

// ===========================
// CONFIGURAÇÃO DO LOGGER
// ===========================

// Formato customizado com mascaramento
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format((info) => {
    // Mascarar dados sensíveis em metadados
    if (info.meta && typeof info.meta === 'object') {
      info.meta = maskSensitiveData(info.meta);
    }
    return info;
  })(),
  winston.format.json()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(maskSensitiveData(meta))}`;
    }
    return msg;
  })
);

// Níveis customizados (incluindo HTTP)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: customFormat,
  defaultMeta: { service: 'trea-ia-backend' },
  transports: [
    // Erros em arquivo separado
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Todos os logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Em desenvolvimento, também logar no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Stream para Morgan
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

logger.logStructured = (entry) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level: entry.level || 'info',
    requestId: entry.requestId || '',
    userId: entry.userId || '',
    action: entry.action || '',
    message: entry.message || '',
  };
  const line = JSON.stringify(payload) + '\n';
  try {
    fs.appendFile(path.join(__dirname, '../../logs/structured.log'), line, () => {});
  } catch {}
};

// Exportar logger e utilitários
module.exports = logger;
module.exports.maskEmail = maskEmail;
module.exports.maskCpfCnpj = maskCpfCnpj;
module.exports.maskPhone = maskPhone;
module.exports.maskPassword = maskPassword;
module.exports.maskIP = maskIP;
module.exports.maskSensitiveData = maskSensitiveData;
