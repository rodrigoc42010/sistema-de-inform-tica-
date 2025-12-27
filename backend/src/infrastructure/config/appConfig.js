const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
const prodOrigins = allowedOriginsEnv
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const corsOrigins = isProduction
  ? prodOrigins.length ? prodOrigins : (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  : [frontendUrl];

const backupPath = path.join(__dirname, '../../../backups');

const rateLimits = {
  login: { windowMs: 15 * 60 * 1000, max: 10 },
  registration: { windowMs: 15 * 60 * 1000, max: 10 },
  authSensitive: { windowMs: 15 * 60 * 1000, max: 5 },
};

module.exports = {
  isProduction,
  frontendUrl,
  corsOrigins,
  backupPath,
  rateLimits,
};

