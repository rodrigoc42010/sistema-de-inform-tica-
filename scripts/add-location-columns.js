const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        const client = await pool.connect();
        console.log('Adding latitude and longitude columns to technicians table...');

        await client.query(`
      ALTER TABLE technicians 
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
    `);

        console.log('Columns added successfully.');

        // Optional: Update existing technicians with a default location (São Paulo) for testing
        // ONLY if they don't have one.
        console.log('Updating existing technicians with default location (São Paulo) for testing...');
        await client.query(`
      UPDATE technicians 
      SET latitude = -23.550520, longitude = -46.633308 
      WHERE latitude IS NULL OR longitude IS NULL;
    `);
        console.log('Technicians updated.');

        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
