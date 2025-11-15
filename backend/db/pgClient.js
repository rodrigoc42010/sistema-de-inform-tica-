let poolInstance = null;

function getPool() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error('DATABASE_URL/POSTGRES_URL ausente');
  }
  if (!poolInstance) {
    const pg = require('pg');
    const defaultSsl = process.env.NODE_ENV === 'production' ? 'true' : 'false';
    const sslEnabled = (process.env.POSTGRES_SSL || defaultSsl) === 'true';
    poolInstance = new pg.Pool({ connectionString: url, ssl: sslEnabled ? { rejectUnauthorized: false } : false });
  }
  return poolInstance;
}

module.exports = { getPool };