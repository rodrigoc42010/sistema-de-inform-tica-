const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');

const normalizeStatus = (s, role) => {
  const map = {
    pendente: 'pendente',
    pending: 'pendente',
    pago: 'pago',
    paid: 'pago',
    recebido: 'recebido',
    received: 'recebido',
    cancelado: 'cancelado',
    cancelled: 'cancelado',
    completed: role === 'technician' ? 'recebido' : 'pago',
  };
  return map[String(s || '').toLowerCase()] || 'pendente';
};

// GET /api/payments
const getPayments = asyncHandler(async (req, res) => {
  const pool = getPool();
  const userId = req.user.id || req.user._id;
  const role = req.user.role;
  const { status, q, method, from, to } = req.query;

  const where = [];
  const params = [];
  where.push(role === 'client' ? 'client=$1' : 'technician=$1');
  params.push(userId);

  if (status) {
    const st = normalizeStatus(status, role);
    params.push(st);
    where.push(`status=$${params.length}`);
  }
  if (method) {
    params.push(method);
    where.push(`payment_method=$${params.length}`);
  }
  if (from) {
    params.push(new Date(from));
    where.push(`created_at >= $${params.length}`);
  }
  if (to) {
    params.push(new Date(to));
    where.push(`created_at <= $${params.length}`);
  }
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`LOWER(text) LIKE $${params.length}`);
  }

  const sql = `SELECT id, ticket, title AS description, amount, currency, status, payment_method, created_at AS date, payment_date AS paid_date
               FROM payments
               WHERE ${where.join(' AND ')}
               ORDER BY created_at DESC
               LIMIT 500`;
  const rs = await pool.query(sql, params);
  const rows = rs.rows.map((r) => ({
    id: r.id,
    ticketId: r.ticket,
    description: r.description,
    amount: Number(r.amount || 0),
    status: r.status,
    date: r.date,
    paidDate: r.paid_date,
    paymentMethod: r.payment_method,
  }));
  res.json({ items: rows });
});

// PUT /api/payments/:id/status
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const pool = getPool();
  const userId = req.user.id || req.user._id;
  const role = req.user.role;
  const id = req.params.id;
  const status = normalizeStatus(req.body.status, role);

  const rsOwn = await pool.query('SELECT id, client, technician FROM payments WHERE id=$1 LIMIT 1', [id]);
  if (!rsOwn.rowCount) {
    res.status(404);
    throw new Error('Pagamento não encontrado');
  }
  const row = rsOwn.rows[0];
  if (role === 'client' && row.client !== userId) {
    res.status(403);
    throw new Error('Não autorizado');
  }
  if (role === 'technician' && row.technician !== userId) {
    res.status(403);
    throw new Error('Não autorizado');
  }

  const paidDate = ['pago', 'recebido'].includes(status) ? new Date() : null;
  await pool.query('UPDATE payments SET status=$1, payment_date=$2 WHERE id=$3', [status, paidDate, id]);
  const rs = await pool.query('SELECT id, status, payment_date FROM payments WHERE id=$1', [id]);
  res.json(rs.rows[0]);
});

// GET /api/payments/report
const getPaymentsReport = asyncHandler(async (req, res) => {
  const pool = getPool();
  const userId = req.user.id || req.user._id;
  const role = req.user.role;
  const { groupBy = 'month', from, to, status } = req.query;
  const st = status ? normalizeStatus(status, role) : null;
  const where = [role === 'client' ? 'client=$1' : 'technician=$1'];
  const params = [userId];
  if (from) { params.push(new Date(from)); where.push(`created_at >= $${params.length}`); }
  if (to) { params.push(new Date(to)); where.push(`created_at <= $${params.length}`); }
  if (st) { params.push(st); where.push(`status=$${params.length}`); }

  let bucket;
  if (groupBy === 'day') bucket = `TO_CHAR(created_at, 'YYYY-MM-DD')`;
  else if (groupBy === 'year') bucket = `TO_CHAR(created_at, 'YYYY')`;
  else bucket = `TO_CHAR(created_at, 'YYYY-MM')`;

  const sql = `SELECT ${bucket} AS period, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
               FROM payments
               WHERE ${where.join(' AND ')}
               GROUP BY period
               ORDER BY period ASC`;
  const rs = await pool.query(sql, params);
  res.json({ groupBy, from, to, status: st, rows: rs.rows });
});

module.exports = { getPayments, updatePaymentStatus, getPaymentsReport };