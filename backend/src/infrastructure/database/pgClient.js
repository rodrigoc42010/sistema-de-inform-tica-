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
    const max = Number(process.env.PG_POOL_MAX || 10);
    const idleTimeoutMillis = Number(process.env.PG_POOL_IDLE || 30000);
    const connectionTimeoutMillis = Number(process.env.PG_CONN_TIMEOUT || 20000);
    poolInstance = new pg.Pool({
      connectionString: url,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
      keepAlive: true,
    });
    console.log(`PG Pool initialized. Host: ${url.split('@')[1]?.split('/')[0] || 'hidden'}, SSL: ${sslEnabled}`.cyan);
    poolInstance.on('error', async (err) => {
      console.error('Unexpected error on idle client', err);
      try { await poolInstance.end(); } catch { }
      poolInstance = null;
    });
  }
  return poolInstance;
}

module.exports = { getPool };