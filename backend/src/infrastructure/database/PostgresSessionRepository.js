const { getPool } = require('../../../db/pgClient');

class PostgresSessionRepository {
  constructor() {
    this.pool = getPool();
  }

  async create({ userId, jti, ipAddress, userAgent, expiresAt }) {
    await this.pool.query(
      `INSERT INTO sessions (user_id, jti, ip_address, user_agent, expires_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, jti, ipAddress, userAgent, expiresAt]
    );
  }

  async findByJti(jti) {
    const rs = await this.pool.query(
      'SELECT * FROM sessions WHERE jti = $1 AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1',
      [jti]
    );
    return rs.rowCount > 0 ? rs.rows[0] : null;
  }

  async revoke(jti) {
    await this.pool.query(
      'UPDATE sessions SET revoked_at = NOW() WHERE jti = $1',
      [jti]
    );
  }

  async revokeAllForUser(userId) {
    await this.pool.query(
      'UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }
}

module.exports = new PostgresSessionRepository();
