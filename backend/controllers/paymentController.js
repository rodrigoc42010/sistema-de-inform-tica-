const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');
const { sendEmail } = require('../utils/emailService');

const { normalizeStatus } = require('../utils/statusNormalizer');
const paymentRepository = require('../repositories/paymentRepository');
const {
  checkPaymentAccess,
  checkPaymentReminderPermission,
  checkPaymentReceiptPermission,
} = require('../utils/authorization/paymentAuth');
const paymentService = require('../services/paymentService');

// GET /api/payments
const getPayments = asyncHandler(async (req, res) => {
  const pool = getPool();
  const userId = req.userId;
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
  const userId = req.userId;
  const role = req.user.role;
  const id = req.params.id;
  const status = normalizeStatus(req.body.status, role);

  const row = await paymentRepository.findById(id);
  if (!row) {
    res.status(404);
    throw new Error('Pagamento não encontrado');
  }
  checkPaymentAccess(row, req.user);

  const updatedPayment = await paymentService.updateStatus(id, status, userId);
  res.json(updatedPayment);
});

// GET /api/payments/report
const getPaymentsReport = asyncHandler(async (req, res) => {
  const reportService = require('../services/reportService');
  const userId = req.userId;
  const role = req.user.role;
  const { groupBy = 'month', from, to, status } = req.query;

  const rows = await reportService.generateReport(
    'payments',
    { userId, role, from, to, status },
    groupBy,
    'amount'
  );

  res.json({ groupBy, from, to, status, rows });
});

// POST /api/payments/:id/remind
const sendPaymentReminder = asyncHandler(async (req, res) => {
  const pool = getPool();
  const userId = req.userId;
  const role = req.user.role;
  const id = req.params.id;

  checkPaymentReminderPermission(req.user);

  const rs = await pool.query(
    `
    SELECT p.id, p.amount, p.title, p.ticket, u.email, u.name 
    FROM payments p
    JOIN users u ON p.client = u.id
    WHERE p.id = $1 AND p.technician = $2 AND p.status = 'pendente'
  `,
    [id, userId]
  );

  if (!rs.rowCount) {
    res.status(404);
    throw new Error('Pagamento pendente não encontrado ou não autorizado');
  }

  await paymentService.sendReminder(rs.rows[0]);
  res.json({ success: true, message: 'Lembrete enviado com sucesso' });
});

// POST /api/payments/:id/receipt
const sendReceipt = asyncHandler(async (req, res) => {
  const pool = getPool();
  const userId = req.userId;
  const role = req.user.role;
  const id = req.params.id;

  // Ambos podem enviar recibo (técnico envia, cliente pode reenviar para si mesmo)
  const rs = await pool.query(
    `
    SELECT p.id, p.amount, p.title, p.ticket, p.payment_date, p.payment_method,
           c.email as client_email, c.name as client_name,
           t.name as tech_name
    FROM payments p
    JOIN users c ON p.client = c.id
    JOIN users t ON p.technician = t.id
    WHERE p.id = $1 AND (p.technician = $2 OR p.client = $2) AND (p.status = 'pago' OR p.status = 'recebido')
  `,
    [id, userId]
  );

  if (!rs.rowCount) {
    res.status(404);
    throw new Error('Pagamento finalizado não encontrado ou não autorizado');
  }

  const payment = rs.rows[0];
  const emailToSend = req.body.email || payment.client_email;

  await paymentService.sendReceipt(rs.rows[0], emailToSend);
  res.json({ success: true, message: 'Recibo enviado com sucesso' });
});

module.exports = {
  getPayments,
  updatePaymentStatus,
  getPaymentsReport,
  sendPaymentReminder,
  sendReceipt,
};
