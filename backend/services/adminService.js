const { getPool } = require('../db/pgClient');
const ticketRepository = require('../repositories/ticketRepository');
const ticketService = require('../services/ticketService');

async function listUsers({ role, search, limit = 20, offset = 0 }) {
  const pool = getPool();
  const params = [];
  const where = [];
  if (role) {
    params.push(role);
    where.push(`role = $${params.length}`);
  }
  if (search) {
    params.push(`%${String(search).trim()}%`);
    where.push(
      `(name ILIKE $${params.length} OR email ILIKE $${params.length})`
    );
  }
  params.push(Number(limit));
  params.push(Number(offset));
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT id,name,email,role,phone,cpf_cnpj,created_at FROM users ${whereSql} ORDER BY created_at DESC NULLS LAST LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const rs = await pool.query(sql, params);
  return rs.rows;
}

async function listTechnicians({ search, limit = 20, offset = 0 }) {
  const pool = getPool();
  const params = ['technician'];
  const where = ['u.role = $1'];
  if (search) {
    params.push(`%${String(search).trim()}%`);
    where.push(
      `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
    );
  }
  params.push(Number(limit));
  params.push(Number(offset));
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT u.id, u.name, u.email, u.phone, u.role, t.id AS technician_id, t.services, t.specialties, t.rating, t.total_reviews, t.availability, t.pickup_service, t.pickup_fee, t.payment_methods, t.created_at, t.updated_at FROM users u JOIN technicians t ON u.id = t.user_id ${whereSql} ORDER BY t.created_at DESC NULLS LAST LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const rs = await pool.query(sql, params);
  return rs.rows;
}

async function listTickets({
  status,
  from,
  to,
  clientId,
  technicianId,
  search,
  limit = 50,
  offset = 0,
}) {
  const pool = getPool();
  const params = [];
  const where = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (clientId) {
    params.push(clientId);
    where.push(`client = $${params.length}`);
  }
  if (technicianId) {
    params.push(technicianId);
    where.push(`technician = $${params.length}`);
  }
  if (from) {
    params.push(new Date(from));
    where.push(`created_at >= $${params.length}`);
  }
  if (to) {
    params.push(new Date(to));
    where.push(`created_at <= $${params.length}`);
  }
  if (search) {
    params.push(`%${String(search).trim()}%`);
    where.push(
      `(title ILIKE $${params.length} OR description ILIKE $${params.length})`
    );
  }
  params.push(Number(limit));
  params.push(Number(offset));
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT id, title, description, status, client, technician, created_at, completion_date, total_price, payment_status FROM tickets ${whereSql} ORDER BY created_at DESC NULLS LAST LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const rs = await pool.query(sql, params);
  return rs.rows;
}

async function updateUserRole(userId, role) {
  const pool = getPool();
  const rs = await pool.query(
    'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, role',
    [role, userId]
  );
  return rs.rowCount ? rs.rows[0] : null;
}

async function logAudit(adminId, action, entity, entityId) {
  const pool = getPool();
  const rs = await pool.query(
    'INSERT INTO admin_audit_logs (admin_id, action, entity, entity_id) VALUES ($1,$2,$3,$4) RETURNING id',
    [adminId, action, entity, entityId ? String(entityId) : null]
  );
  return rs.rows[0];
}

module.exports = {
  listUsers,
  listTechnicians,
  listTickets,
  updateUserRole,
  logAudit,
  async getSummary() {
    const pool = getPool();
    const [u, tTotal, tCli, tk, tkStatus, recentUsers, recentTickets] =
      await Promise.all([
        pool.query('SELECT COUNT(*)::int AS c FROM users'),
        pool.query(
          "SELECT COUNT(*)::int AS c FROM users WHERE role='technician'"
        ),
        pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role='client'"),
        pool.query('SELECT COUNT(*)::int AS c FROM tickets'),
        pool.query(
          'SELECT status, COUNT(*)::int AS c FROM tickets GROUP BY status ORDER BY status'
        ),
        pool.query(
          'SELECT id,email,role,created_at FROM users ORDER BY created_at DESC NULLS LAST LIMIT 5'
        ),
        pool.query(
          'SELECT id,title,status,created_at FROM tickets ORDER BY created_at DESC NULLS LAST LIMIT 5'
        ),
      ]);
    return {
      totals: {
        users: u.rows[0].c,
        technicians: tTotal.rows[0].c,
        clients: tCli.rows[0].c,
        tickets: tk.rows[0].c,
      },
      ticketStatus: tkStatus.rows,
      recent: {
        users: recentUsers.rows,
        tickets: recentTickets.rows,
      },
    };
  },
  async blockUser(userId) {
    const pool = getPool();
    const rs = await pool.query(
      "UPDATE users SET lock_until = NOW() + INTERVAL '100 years', failed_login_attempts = COALESCE(failed_login_attempts,0)+1 WHERE id=$1 RETURNING id, lock_until, failed_login_attempts",
      [userId]
    );
    return rs.rowCount ? rs.rows[0] : null;
  },
  async unblockUser(userId) {
    const pool = getPool();
    const rs = await pool.query(
      'UPDATE users SET lock_until = NULL, failed_login_attempts = 0 WHERE id=$1 RETURNING id',
      [userId]
    );
    return rs.rowCount ? rs.rows[0] : null;
  },
  async promoteToTechnician(userId) {
    const pool = getPool();
    const exists = await pool.query(
      'SELECT id FROM technicians WHERE user_id=$1 LIMIT 1',
      [userId]
    );
    let techId = exists.rowCount ? exists.rows[0].id : null;
    if (!techId) {
      const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`;
      const ins = await pool.query(
        'INSERT INTO technicians (user_id, login_id, availability) VALUES ($1,$2,TRUE) RETURNING id',
        [userId, loginId]
      );
      techId = ins.rows[0].id;
    }
    await pool.query('UPDATE users SET role=$1 WHERE id=$2', [
      'technician',
      userId,
    ]);
    return { id: userId, role: 'technician', technicianId: techId };
  },
  async setTechnicianAvailability(userId, available) {
    const pool = getPool();
    const rs = await pool.query(
      'UPDATE technicians SET availability=$1 WHERE user_id=$2 RETURNING id, user_id, availability',
      [!!available, userId]
    );
    return rs.rowCount ? rs.rows[0] : null;
  },
  async getTicket(id) {
    const pool = getPool();
    const rs = await pool.query('SELECT * FROM tickets WHERE id=$1 LIMIT 1', [
      id,
    ]);
    return rs.rowCount ? rs.rows[0] : null;
  },
  async adminUpdateTicket(id, updates) {
    const current = await ticketRepository.findById(id);
    if (!current) return null;
    const updated = await ticketService.updateTicket(
      id,
      updates,
      current,
      null
    );
    return updated;
  },
  async getHealth() {
    const pool = getPool();
    let database = 'disconnected';
    try {
      await pool.query('SELECT 1');
      database = 'connected';
    } catch {}
    let migrations = 'unknown';
    try {
      const rs = await pool.query(
        "SELECT to_regclass('public.users') AS users, to_regclass('public.technicians') AS technicians, to_regclass('public.tickets') AS tickets, to_regclass('public.admin_audit_logs') AS admin_audit_logs"
      );
      const okTables =
        !!rs.rows[0].users &&
        !!rs.rows[0].technicians &&
        !!rs.rows[0].tickets &&
        !!rs.rows[0].admin_audit_logs;
      migrations = okTables ? 'ok' : 'missing';
    } catch {}
    return {
      status:
        database === 'connected' && migrations === 'ok' ? 'ok' : 'degraded',
      database,
      migrations,
      timestamp: new Date().toISOString(),
    };
  },
};
