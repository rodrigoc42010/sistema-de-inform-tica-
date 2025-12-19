const { getPool } = require('../../../db/pgClient');
const User = require('../../domain/User');

class PostgresUserRepository {
  constructor() {
    this.pool = getPool();
  }

  async findByEmail(email) {
    const rs = await this.pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (rs.rowCount === 0) return null;
    return this._mapToEntity(rs.rows[0]);
  }

  async findById(id) {
    const rs = await this.pool.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    if (rs.rowCount === 0) return null;
    return this._mapToEntity(rs.rows[0]);
  }

  async create(user, client = null) {
    const db = client || this.pool;
    const rs = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, cpf_cnpj) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        user.name,
        user.email,
        user.passwordHash,
        user.role,
        user.phone,
        user.cpfCnpj,
      ]
    );
    return this._mapToEntity(rs.rows[0]);
  }

  async update(user) {
    const rs = await this.pool.query(
      `UPDATE users SET 
        name = $1, 
        phone = $2, 
        address_street = $3, 
        address_number = $4, 
        address_city = $5, 
        address_state = $6, 
        address_zipcode = $7, 
        updated_at = NOW() 
       WHERE id = $8 
       RETURNING *`,
      [
        user.name,
        user.phone,
        user.address.street,
        user.address.number,
        user.address.city,
        user.address.state,
        user.address.zipcode,
        user.id,
      ]
    );
    return this._mapToEntity(rs.rows[0]);
  }

  _mapToEntity(row) {
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      phone: row.phone,
      cpfCnpj: row.cpf_cnpj,
      address: {
        street: row.address_street,
        number: row.address_number,
        city: row.address_city,
        state: row.address_state,
        zipcode: row.address_zipcode,
      },
      profileImageUrl: row.profile_image_url,
      emailVerified: row.email_verified,
      twofaEnabled: row.twofa_enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = new PostgresUserRepository();
