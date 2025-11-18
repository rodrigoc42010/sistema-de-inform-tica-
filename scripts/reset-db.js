const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { getPool } = require('../backend/db/pgClient');

async function run() {
  try {
    if (process.env.DB_RESET_ON_DEPLOY !== 'true') {
      console.log('DB reset desativado. Defina DB_RESET_ON_DEPLOY=true para executar.');
      return;
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DROP TABLE IF EXISTS payment_logs CASCADE');
      await client.query('DROP TABLE IF EXISTS subscriptions CASCADE');
      await client.query('DROP TABLE IF EXISTS plans CASCADE');
      await client.query('DROP TABLE IF EXISTS payments CASCADE');
      await client.query('DROP TABLE IF EXISTS ads CASCADE');
      await client.query('DROP TABLE IF EXISTS tickets CASCADE');
      await client.query('DROP TABLE IF EXISTS technicians CASCADE');
      await client.query('DROP TABLE IF EXISTS blacklisted_tokens CASCADE');
      await client.query('DROP TABLE IF EXISTS users CASCADE');
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    const initPostgres = require('../backend/config/pg');
    const ok = await initPostgres();
    if (!ok) throw new Error('Falha ao recriar estruturas');
    console.log('Banco redefinido e reconfigurado com sucesso.');
  } catch (err) {
    console.error('Erro no reset do banco:', err.message);
    process.exit(1);
  }
}

run();