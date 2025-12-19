const { getPool } = require('../../db/pgClient');
const Payment = require('../../domain/Payment');

class PostgresPaymentRepository {
  constructor() {
    this.pool = getPool();
  }

  async create(payment, client = null) {
    const db = client || this.pool;
    const rs = await db.query(
      `INSERT INTO payments (
        ticket_id, user_id, amount, currency, payment_method, status, external_id, receipt_url, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        payment.ticketId,
        payment.userId,
        payment.amount,
        payment.currency,
        payment.paymentMethod,
        payment.status,
        payment.externalId,
        payment.receiptUrl,
        payment.notes,
      ]
    );
    return this._mapToEntity(rs.rows[0]);
  }

  async findAll({ userId, role, status, method, from, to, q }) {
    const where = [];
    const params = [];
    let i = 1;

    if (role === 'client') {
      where.push(`user_id = $${i}`);
    } else {
      // In a real app, we'd have a technician_id or similar in payments
      // For now, let's assume user_id is the one involved
      where.push(`user_id = $${i}`);
    }
    params.push(userId);
    i++;

    if (status) {
      where.push(`status = $${i}`);
      params.push(status);
      i++;
    }
    if (method) {
      where.push(`payment_method = $${i}`);
      params.push(method);
      i++;
    }
    if (from) {
      where.push(`created_at >= $${i}`);
      params.push(new Date(from));
      i++;
    }
    if (to) {
      where.push(`created_at <= $${i}`);
      params.push(new Date(to));
      i++;
    }
    if (q) {
      where.push(`notes ILIKE $${i}`);
      params.push(`%${q}%`);
      i++;
    }

    const query = `
      SELECT * FROM payments 
      WHERE ${where.join(' AND ')} 
      ORDER BY created_at DESC 
      LIMIT 500
    `;
    const rs = await this.pool.query(query, params);
    return rs.rows.map((row) => this._mapToEntity(row));
  }

  async findById(id) {
    const rs = await this.pool.query(
      'SELECT * FROM payments WHERE id = $1 LIMIT 1',
      [id]
    );
    if (rs.rowCount === 0) return null;
    return this._mapToEntity(rs.rows[0]);
  }

  async updateStatus(id, status, externalId = null, client = null) {
    const db = client || this.pool;
    const rs = await db.query(
      `UPDATE payments SET status = $1, external_id = COALESCE($2, external_id), updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [status, externalId, id]
    );
    return this._mapToEntity(rs.rows[0]);
  }

  _mapToEntity(row) {
    return new Payment({
      id: row.id,
      ticketId: row.ticket_id,
      userId: row.user_id,
      amount: row.amount,
      currency: row.currency,
      paymentMethod: row.payment_method,
      status: row.status,
      externalId: row.external_id,
      receiptUrl: row.receipt_url,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = new PostgresPaymentRepository();
