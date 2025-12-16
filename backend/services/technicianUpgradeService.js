const { getPool } = require('../db/pgClient');
const GeocodingService = require('./geocodingService');
const { BadRequestError, NotFoundError, ConflictError, InternalServerError } = require('../utils/httpErrors');

class TechnicianUpgradeService {
  async createRequest(userId, payload) {
    const pool = getPool();
    const {
      services = [],
      specialties = [],
      pickupService = false,
      pickupFee = 0,
      paymentMethods = [],
      notes = null,
    } = payload || {};
    const rs = await pool.query(
      'INSERT INTO technician_upgrade_requests (user_id,status,services,specialties,pickup_service,pickup_fee,payment_methods,notes,requested_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *',
      [
        userId,
        'pending',
        JSON.stringify(services),
        JSON.stringify(specialties),
        !!pickupService,
        Number(pickupFee || 0),
        JSON.stringify(paymentMethods),
        notes,
      ]
    );
    return rs.rows[0];
  }

  async listRequests({ status, limit = 20, offset = 0 }) {
    const pool = getPool();
    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = 'WHERE status=$1';
    }
    params.push(limit);
    params.push(offset);
    const rs = await pool.query(
      `SELECT * FROM technician_upgrade_requests ${where} ORDER BY requested_at DESC NULLS LAST, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rs.rows;
  }

  async getById(id) {
    const pool = getPool();
    const rs = await pool.query('SELECT * FROM technician_upgrade_requests WHERE id=$1 LIMIT 1', [id]);
    if (!rs.rowCount) throw new NotFoundError('Solicitação não encontrada');
    return rs.rows[0];
  }

  async cancelRequest(id, userId) {
    const pool = getPool();
    const rs = await pool.query('SELECT * FROM technician_upgrade_requests WHERE id=$1 AND user_id=$2 LIMIT 1', [id, userId]);
    if (!rs.rowCount) throw new NotFoundError('Solicitação não encontrada');
    const row = rs.rows[0];
    if (row.status !== 'pending') throw new ConflictError('Solicitação não pode ser cancelada');
    const upd = await pool.query('UPDATE technician_upgrade_requests SET status=$1, reviewed_at=NOW() WHERE id=$2 RETURNING *', ['cancelled', id]);
    return upd.rows[0];
  }

  async approveRequest(id, adminUserId, adminNotes = null) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const r = await client.query('SELECT * FROM technician_upgrade_requests WHERE id=$1 LIMIT 1', [id]);
      if (!r.rowCount) throw new NotFoundError('Solicitação não encontrada');
      const req = r.rows[0];
      if (req.status !== 'pending') throw new ConflictError('Solicitação já processada');
      const ures = await client.query('SELECT id,name,email,role,phone,address FROM users WHERE id=$1 LIMIT 1', [req.user_id]);
      if (!ures.rowCount) throw new NotFoundError('Usuário não encontrado');
      const user = ures.rows[0];
      const mappedServices = Array.isArray(req.services) ? req.services : (() => { try { return JSON.parse(req.services || '[]'); } catch { return []; }})();
      const mappedSpecialties = Array.isArray(req.specialties) ? req.specialties : (() => { try { return JSON.parse(req.specialties || '[]'); } catch { return []; }})();
      const paymentMethods = Array.isArray(req.payment_methods) ? req.payment_methods : (() => { try { return JSON.parse(req.payment_methods || '[]'); } catch { return []; }})();
      let lat = null;
      let lng = null;
      if (user.address) {
        try {
          const coords = await GeocodingService.getCoordinates(user.address);
          if (coords) {
            lat = coords.latitude;
            lng = coords.longitude;
          }
        } catch {}
      }
      const existsTech = await client.query('SELECT 1 FROM technicians WHERE user_id=$1 LIMIT 1', [user.id]);
      if (!existsTech.rowCount) {
        const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        await client.query(
          'INSERT INTO technicians (user_id,login_id,services,specialties,pickup_service,pickup_fee,payment_methods,latitude,longitude) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [
            user.id,
            loginId,
            JSON.stringify(mappedServices),
            JSON.stringify(mappedSpecialties),
            !!req.pickup_service,
            Number(req.pickup_fee || 0),
            JSON.stringify(paymentMethods),
            lat,
            lng,
          ]
        );
      }
      if (user.role !== 'technician') {
        await client.query('UPDATE users SET role=$1 WHERE id=$2', ['technician', user.id]);
      }
      const upd = await client.query(
        'UPDATE technician_upgrade_requests SET status=$1, reviewed_at=NOW(), reviewed_by=$2, admin_notes=$3, approved_by=$2, approved_at=NOW() WHERE id=$4 RETURNING *',
        ['approved', adminUserId, adminNotes, id]
      );
      await client.query('COMMIT');
      return upd.rows[0];
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch {}
      if (e instanceof BadRequestError || e instanceof NotFoundError || e instanceof ConflictError) throw e;
      throw new InternalServerError(e.message || 'Falha ao aprovar solicitação');
    } finally {
      client.release();
    }
  }

  async rejectRequest(id, adminUserId, reason = null) {
    const pool = getPool();
    const r = await pool.query('SELECT status FROM technician_upgrade_requests WHERE id=$1 LIMIT 1', [id]);
    if (!r.rowCount) throw new NotFoundError('Solicitação não encontrada');
    const st = r.rows[0].status;
    if (st !== 'pending') throw new ConflictError('Solicitação já processada');
    const upd = await pool.query(
      'UPDATE technician_upgrade_requests SET status=$1, reviewed_at=NOW(), reviewed_by=$2, admin_notes=$3 WHERE id=$4 RETURNING *',
      ['rejected', adminUserId, reason, id]
    );
    return upd.rows[0];
  }
}

module.exports = new TechnicianUpgradeService();
