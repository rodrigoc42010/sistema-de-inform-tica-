const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');
const GeocodingService = require('../backend/services/geocodingService');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixLocations() {
    try {
        const client = await pool.connect();
        console.log('Fetching technicians...');

        // Get technicians and their user addresses
        const res = await client.query(`
      SELECT t.id, t.user_id, u.address 
      FROM technicians t
      JOIN users u ON t.user_id = u.id
    `);

        console.log(`Found ${res.rowCount} technicians.`);

        for (const tech of res.rows) {
            if (!tech.address) {
                console.log(`Technician ${tech.id} has no address. Skipping.`);
                continue;
            }

            console.log(`Geocoding address for technician ${tech.id}...`);
            try {
                // Handle address stored as JSON or string
                let addressObj = tech.address;
                if (typeof addressObj === 'string') {
                    try {
                        addressObj = JSON.parse(addressObj);
                    } catch (e) {
                        // If not JSON, it might be a simple string, but GeocodingService expects object with street, city etc.
                        // or we might need to adjust GeocodingService to handle string.
                        // Looking at GeocodingService, it constructs fullAddress from object properties.
                        // If it's a string, we might need to pass it differently or parse it manually.
                        // For now assuming it's a JSON string if it's a string.
                        console.warn(`Address is a string but not JSON for tech ${tech.id}: ${addressObj}`);
                        continue;
                    }
                }

                const coords = await GeocodingService.getCoordinates(addressObj);

                if (coords) {
                    await client.query(
                        'UPDATE technicians SET latitude=$1, longitude=$2 WHERE id=$3',
                        [coords.latitude, coords.longitude, tech.id]
                    );
                    console.log(`Updated technician ${tech.id} with location: ${coords.latitude}, ${coords.longitude}`);
                } else {
                    console.warn(`Could not geocode address for technician ${tech.id}`);
                }
            } catch (err) {
                console.error(`Error processing technician ${tech.id}:`, err.message);
            }

            // Sleep briefly to avoid rate limits if many
            await new Promise(r => setTimeout(r, 200));
        }

        client.release();
        console.log('Finished updating locations.');
    } catch (err) {
        console.error('Script failed:', err);
    } finally {
        await pool.end();
    }
}

fixLocations();
