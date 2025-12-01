const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function inspectAddress() {
    try {
        const client = await pool.connect();
        const res = await client.query("SELECT u.address FROM technicians t JOIN users u ON t.user_id = u.id WHERE t.id='1e0df077-f388-4e83-8fc4-68cf2623acd4'");
        if (res.rows.length > 0) {
            console.log(JSON.stringify(res.rows[0].address, null, 2));
        } else {
            console.log('User not found');
        }
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspectAddress();
