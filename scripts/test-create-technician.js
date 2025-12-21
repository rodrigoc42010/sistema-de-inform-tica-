const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const { getPool } = require('../backend/src/infrastructure/database/pgClient');
const bcrypt = require('bcryptjs');

async function testCreateTechnician() {
  console.log('--- TEST CREATE TECHNICIAN ---');
  const pool = getPool();
  const client = await pool.connect();

  const email = `test_tech_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Test Technician';
  const cpfCnpj = `123456789${Math.floor(Math.random() * 100)}`; // Mock CPF

  try {
    await client.query('BEGIN');

    // Simulate userController logic
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log(`Creating user: ${email}`);
    const userRes = await client.query(
      'INSERT INTO users (name,email,password,role,phone,cpf_cnpj,email_verified,terms_accepted,terms_accepted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
      [
        name,
        email,
        hashedPassword,
        'technician',
        '1234567890',
        cpfCnpj,
        false,
        true,
        new Date(),
      ]
    );
    const userId = userRes.rows[0].id;
    console.log(`User created with ID: ${userId}`);

    const loginId = `TEC${Date.now()}`;
    console.log(`Creating technician record for user ${userId}`);

    await client.query(
      'INSERT INTO technicians (user_id,login_id,services,specialties,pickup_service,pickup_fee,payment_methods) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, loginId, '[]', '[]', false, 0, '[]']
    );
    console.log('Technician record created.');

    await client.query('COMMIT');
    console.log('Transaction committed.');

    // Verify
    const checkUser = await client.query('SELECT * FROM users WHERE id=$1', [
      userId,
    ]);
    const checkTech = await client.query(
      'SELECT * FROM technicians WHERE user_id=$1',
      [userId]
    );

    if (checkUser.rowCount === 1 && checkTech.rowCount === 1) {
      console.log('SUCCESS: User and Technician persisted.');
    } else {
      console.error('FAILURE: User or Technician not found after commit.');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR: Failed to create technician.');
    console.error(err);
  } finally {
    client.release();
  }
}

testCreateTechnician();
