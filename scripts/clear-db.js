const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const { getPool } = require('../backend/src/infrastructure/database/pgClient');

async function clearDatabase() {
  console.log('--- CLEARING DATABASE ---');
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Deleting all technicians...');
    await client.query('DELETE FROM technicians');

    console.log('Deleting all users...');
    await client.query('DELETE FROM users');

    await client.query('COMMIT');
    console.log('Database cleared successfully.');

    // Verify
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const techCount = await client.query('SELECT COUNT(*) FROM technicians');

    console.log(`Remaining Users: ${userCount.rows[0].count}`);
    console.log(`Remaining Technicians: ${techCount.rows[0].count}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR: Failed to clear database.');
    console.error(err);
  } finally {
    client.release();
    // We need to close the pool to let the script exit,
    // but getPool returns a singleton that might be used by the server if we were inside the server process.
    // Since this is a standalone script, we can try to end the pool if we can access it,
    // but pgClient doesn't export a way to close the pool easily without potentially affecting others if it were shared (it's not here).
    // We'll just exit the process.
    process.exit(0);
  }
}

clearDatabase();
