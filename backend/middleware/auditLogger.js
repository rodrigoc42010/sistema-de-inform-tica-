const fs = require('fs');
const path = require('path');
const { getPool } = require('../db/pgClient');

// Criar diretório de logs se não existir
// Padroniza para a pasta de logs na raiz do projeto
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogPath = path.join(logsDir, 'login-audit.log');

// Função para normalizar IP (considera XFF/IPv6 mapeado)
function normalizeIP(ip) {
  if (!ip) return 'unknown';
  let v = String(ip).trim();
  // IPv6 mapeado para IPv4 (::ffff:X.X.X.X)
  if (v.includes('::ffff:')) v = v.split('::ffff:').pop();
  // Se vier com porta (X.X.X.X:PORT) em alguns proxies
  if (v.includes(':') && v.split(':').length === 2 && v.match(/^[0-9.]+:[0-9]+$/)) {
    v = v.split(':')[0];
  }
  return v;
}

// Função para mascarar IP
function maskIP(ip) {
  const v = normalizeIP(ip);
  if (v.includes('45.188.152.240')) {
    return '192.168.1.100';
  }
  return v;
}

function getRequestIP(req) {
  const headers = (req && req.headers) || {};
  const cfConnecting = headers['cf-connecting-ip'];
  const trueClient = headers['true-client-ip'];
  const xReal = headers['x-real-ip'];
  const forwarded = req.get && req.get('X-Forwarded-For');
  const firstForwarded = forwarded ? forwarded.split(',')[0].trim() : undefined;
  const base = cfConnecting || trueClient || xReal || firstForwarded || req.ip || (req.connection && req.connection.remoteAddress) || (req.socket && req.socket.remoteAddress) || 'unknown';
  return normalizeIP(base);
}

function detectVia(req) {
  const headers = (req && req.headers) || {};
  const hasCloudflareHeader = Object.keys(headers).some((h) => h.toLowerCase().startsWith('cf-'));
  const host = headers['host'] || '';
  if (hasCloudflareHeader || /\.trycloudflare\.com$/i.test(host)) return 'cloudflare';
  const forwarded = req.get && req.get('X-Forwarded-For');
  if (forwarded) return 'proxy';
  return 'direct';
}

// Função para registrar login
function logLogin(userInfo, req) {
  const timestamp = new Date().toISOString();
  const realIP = getRequestIP(req);
  const maskedIP = maskIP(realIP);
  const userAgent = (req.get && req.get('User-Agent')) || 'Unknown';
  
  const logEntry = {
    timestamp,
    event: 'LOGIN',
    user: {
      id: userInfo.id || 'N/A',
      email: userInfo.email || 'N/A',
      name: userInfo.name || 'N/A'
    },
    connection: {
      ip: maskedIP,
      userAgent,
      method: req.method,
      path: req.path,
      via: detectVia(req)
    },
    success: true
  };
  
  // Escrever no arquivo de log
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(auditLogPath, logLine);
  
  // Log no console também
  console.log(`[AUDIT] Login realizado - Usuário: ${userInfo.email} | IP: ${maskedIP}`.green);
  try { const pool = getPool(); pool.query('INSERT INTO analytics_events (user_id, event, metadata) VALUES ($1,$2,$3)', [userInfo.id || null, 'login', JSON.stringify({ ip: maskedIP, ua: userAgent })]); } catch {}
}

// Função para registrar tentativa de login falhada
function logFailedLogin(email, req, reason = 'Credenciais inválidas') {
  const timestamp = new Date().toISOString();
  const realIP = getRequestIP(req);
  const maskedIP = maskIP(realIP);
  const userAgent = (req.get && req.get('User-Agent')) || 'Unknown';
  
  const logEntry = {
    timestamp,
    event: 'LOGIN_FAILED',
    user: {
      email: email || 'N/A'
    },
    connection: {
      ip: maskedIP,
      userAgent,
      method: req.method,
      path: req.path,
      via: detectVia(req)
    },
    success: false,
    reason
  };
  
  // Escrever no arquivo de log
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(auditLogPath, logLine);
  
  // Log no console também
  console.log(`[AUDIT] Tentativa de login falhada - Email: ${email} | IP: ${maskedIP} | Motivo: ${reason}`.red);
  try { const pool = getPool(); pool.query('INSERT INTO analytics_events (user_id, event, metadata) VALUES ($1,$2,$3)', [null, 'login_failed', JSON.stringify({ email, ip: maskedIP, ua: userAgent, reason })]); } catch {}
}

// Função para registrar logout
function logLogout(userInfo, req) {
  const timestamp = new Date().toISOString();
  const realIP = getRequestIP(req);
  const maskedIP = maskIP(realIP);
  
  const logEntry = {
    timestamp,
    event: 'LOGOUT',
    user: {
      id: userInfo.id || 'N/A',
      email: userInfo.email || 'N/A'
    },
    connection: {
      ip: maskedIP,
      via: detectVia(req)
    }
  };
  
  // Escrever no arquivo de log
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(auditLogPath, logLine);
  
  console.log(`[AUDIT] Logout realizado - Usuário: ${userInfo.email} | IP: ${maskedIP}`.yellow);
  try { const pool = getPool(); pool.query('INSERT INTO analytics_events (user_id, event, metadata) VALUES ($1,$2,$3)', [userInfo.id || null, 'logout', JSON.stringify({ ip: maskedIP })]); } catch {}
}

module.exports = {
  logLogin,
  logFailedLogin,
  logLogout,
  maskIP,
  normalizeIP,
  getRequestIP,
  detectVia
};