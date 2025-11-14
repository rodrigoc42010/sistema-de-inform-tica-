let poolInstance = null;

function getPool() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!poolInstance) {
    const pg = require('pg');
    const sslEnabled = (process.env.POSTGRES_SSL || 'true') === 'true';
    poolInstance = new pg.Pool({ connectionString: url, ssl: sslEnabled ? { rejectUnauthorized: false } : false });
  }
  return poolInstance;
}

module.exports = { getPool };