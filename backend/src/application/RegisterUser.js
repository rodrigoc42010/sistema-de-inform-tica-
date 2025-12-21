const bcrypt = require('bcryptjs');
const { ConflictError } = require('../utils/httpErrors');
const userRepository = require('../infrastructure/database/PostgresUserRepository');
const technicianRepository = require('../infrastructure/database/PostgresTechnicianRepository');
const { getPool } = require('../../db/pgClient');

class RegisterUser {
  async execute({
    name,
    email,
    password,
    role,
    phone,
    cpfCnpj,
    technician = null,
  }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Usuário já cadastrado');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const user = await userRepository.create(
        {
          name,
          email,
          passwordHash,
          role,
          phone,
          cpfCnpj,
        },
        client
      );

      if (role === 'technician' && technician) {
        await client.query(
          `INSERT INTO technicians (user_id, bio, pickup_service, pickup_fee) 
           VALUES ($1, $2, $3, $4)`,
          [
            user.id,
            technician.bio || '',
            technician.pickupService || false,
            technician.pickupFee || 0,
          ]
        );
      }

      await client.query('COMMIT');

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImageUrl,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new RegisterUser();
