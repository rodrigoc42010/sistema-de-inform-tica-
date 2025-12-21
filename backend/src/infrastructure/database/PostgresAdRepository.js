const { getPool } = require('./pgClient');
const Ad = require('../../domain/Ad');

class PostgresAdRepository {
  constructor() {
    this.pool = getPool();
  }

  async create(ad, client = null) {
    const db = client || this.pool;
    const rs = await db.query(
      `INSERT INTO ads (
        title, text, link_url, media_url, audience, tier, duration_days, 
        price, payment_status, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        ad.title,
        ad.text,
        ad.linkUrl,
        ad.mediaUrl,
        ad.audience,
        ad.tier,
        ad.durationDays,
        ad.price,
        ad.paymentStatus,
        ad.status,
        ad.createdBy,
      ]
    );
    return this._mapToEntity(rs.rows[0]);
  }

  async findById(id) {
    const rs = await this.pool.query(
      'SELECT * FROM ads WHERE id = $1 LIMIT 1',
      [id]
    );
    if (rs.rowCount === 0) return null;
    return this._mapToEntity(rs.rows[0]);
  }

  async update(id, data, client = null) {
    const db = client || this.pool;
    const sets = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(data)) {
      sets.push(`${this._toSnakeCase(key)} = $${i}`);
      values.push(value);
      i++;
    }

    values.push(id);
    const query = `UPDATE ads SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
    const rs = await db.query(query, values);
    return this._mapToEntity(rs.rows[0]);
  }

  async findAllActive(audience = null) {
    let query = `
      SELECT * FROM ads 
      WHERE status = 'active' 
      AND (start_date IS NULL OR start_date <= NOW()) 
      AND (end_date IS NULL OR end_date >= NOW())
    `;
    const params = [];
    if (audience) {
      query += ` AND (audience = 'all' OR audience = $1)`;
      params.push(audience);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const rs = await this.pool.query(query, params);
    return rs.rows.map((row) => this._mapToEntity(row));
  }

  async findByCreator(userId) {
    const rs = await this.pool.query(
      'SELECT * FROM ads WHERE created_by = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rs.rows.map((row) => this._mapToEntity(row));
  }

  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  _mapToEntity(row) {
    return new Ad({
      id: row.id,
      title: row.title,
      text: row.text,
      linkUrl: row.link_url,
      mediaUrl: row.media_url,
      audience: row.audience,
      tier: row.tier,
      durationDays: row.duration_days,
      price: row.price,
      paymentStatus: row.payment_status,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = new PostgresAdRepository();
