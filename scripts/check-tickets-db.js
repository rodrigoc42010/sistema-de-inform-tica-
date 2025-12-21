const { getPool } = require('../backend/src/infrastructure/database/pgClient');

async function checkTickets() {
  try {
    const pool = getPool();

    console.log('Checking tickets in database...\n');

    const result = await pool.query(`
      SELECT 
        t.id, 
        t.title, 
        t.client, 
        t.technician, 
        t.status,
        t.created_at,
        u_client.name as client_name,
        u_tech.name as technician_name
      FROM tickets t
      LEFT JOIN users u_client ON t.client = u_client.id
      LEFT JOIN users u_tech ON t.technician = u_tech.id
      ORDER BY t.created_at DESC 
      LIMIT 10
    `);

    console.log(`Found ${result.rowCount} tickets:\n`);

    result.rows.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.title}`);
      console.log(`   ID: ${ticket.id}`);
      console.log(`   Client: ${ticket.client_name || ticket.client}`);
      console.log(
        `   Technician: ${ticket.technician_name || ticket.technician || 'NONE'}`
      );
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Created: ${ticket.created_at}`);
      console.log('');
    });

    const withTech = result.rows.filter((t) => t.technician).length;
    const withoutTech = result.rows.filter((t) => !t.technician).length;

    console.log('Summary:');
    console.log(`- Tickets with technician: ${withTech}`);
    console.log(`- Tickets without technician: ${withoutTech}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTickets();
