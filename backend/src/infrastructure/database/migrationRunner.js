const fs = require('fs');
const path = require('path');
const { getPool } = require('./pgClient');
const colors = require('colors');

async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Create migrations history table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations_history (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, '../../../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`[Migrations] Found ${files.length} migration files.`.cyan);

    for (const file of files) {
      const { rowCount } = await client.query(
        'SELECT 1 FROM migrations_history WHERE name = $1',
        [file]
      );

      if (rowCount === 0) {
        console.log(`[Migrations] Executing ${file}...`.yellow);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations_history (name) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`[Migrations] ${file} executed successfully.`.green);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(
            `[Migrations] Error executing ${file}:`.red,
            err.message
          );
          throw err;
        }
      } else {
        // console.log(`[Migrations] ${file} already executed.`.gray);
      }
    }

    console.log('[Migrations] All migrations are up to date.'.green.bold);
  } catch (err) {
    console.error('[Migrations] Migration runner failed:'.red, err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

module.exports = runMigrations;
