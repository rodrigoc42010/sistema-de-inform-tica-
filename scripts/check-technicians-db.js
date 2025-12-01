const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTechnicians() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('Connected.');

        // Count total technicians
        const resTotal = await client.query("SELECT COUNT(*) FROM users WHERE role = 'technician'");
        console.log(`Total technicians (users table): ${resTotal.rows[0].count}`);

        // Count technicians in technicians table
        const resTechTable = await client.query("SELECT COUNT(*) FROM technicians");
        console.log(`Total technicians (technicians table): ${resTechTable.rows[0].count}`);

        // Count technicians with valid geolocation
        const resGeo = await client.query("SELECT COUNT(*) FROM technicians WHERE latitude IS NOT NULL AND longitude IS NOT NULL");
        console.log(`Technicians with valid geolocation: ${resGeo.rows[0].count}`);

        // Show a sample
        const resSample = await client.query("SELECT id, latitude, longitude FROM technicians WHERE latitude IS NOT NULL LIMIT 3");
        if (resSample.rows.length > 0) {
            console.log('Sample technicians with location:');
            console.table(resSample.rows);
        } else {
            console.log('No technicians with location found.');
        }

        client.release();
    } catch (err) {
        console.error('Error checking database:', err);
    } finally {
        await pool.end();
    }
}

checkTechnicians();
