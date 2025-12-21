const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { getPool } = require('../backend/src/infrastructure/database/pgClient');

async function debug() {
  console.log('--- DEBUG INFO ---');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DEMO_MODE:', process.env.DEMO_MODE);
  console.log('DB_RESET_ON_DEPLOY:', process.env.DB_RESET_ON_DEPLOY);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');

  const isDemo =
    process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
  console.log('Effective isDemo:', isDemo);

  if (process.env.DB_RESET_ON_DEPLOY === 'true') {
    console.error(
      'CRITICAL WARNING: DB_RESET_ON_DEPLOY is true! The database might be wiped on deploy/restart.'
    );
  }

  if (isDemo) {
    console.log(
      'WARNING: System is running in DEMO MODE. Users will NOT be saved to DB.'
    );
  }

  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error('ERROR: No database URL configured.');
    return;
  }

  console.log('--- DB CONNECTION TEST ---');
  try {
    const pool = getPool();
    const client = await pool.connect();
    console.log('DB Connection: SUCCESS');

    const res = await client.query('SELECT NOW()');
    console.log('DB Time:', res.rows[0].now);

    console.log('--- USER COUNT ---');
    const countRes = await client.query('SELECT COUNT(*) FROM users');
    console.log('Total Users in DB:', countRes.rows[0].count);

    console.log('--- TECHNICIAN COUNT ---');
    const techCountRes = await client.query('SELECT COUNT(*) FROM technicians');
    console.log('Total Technicians in DB:', techCountRes.rows[0].count);

    client.release();
  } catch (err) {
    console.error('DB Connection: FAILED');
    console.error(err);
  }
}

debug();
