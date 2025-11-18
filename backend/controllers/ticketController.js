const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');

// @desc    Criar novo ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    priority,
    deviceType,
    deviceBrand,
    deviceModel,
    problemCategory,
    attachments,
    serviceItems,
    initialDiagnosis,
    pickupRequested,
    pickupAddress,
  } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Título e descrição são obrigatórios');
  }

  const pool = getPool();
  const inserted = await pool.query(
    'INSERT INTO tickets (title,description,priority,device_type,device_brand,device_model,attachments,service_items,initial_diagnosis,pickup_requested,pickup_address,client,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
    [
      title,
      description,
      priority || null,
      deviceType || null,
      deviceBrand || null,
      deviceModel || null,
      JSON.stringify(Array.isArray(attachments) ? attachments : []),
      JSON.stringify(Array.isArray(serviceItems) ? serviceItems : []),
      initialDiagnosis || null,
      !!pickupRequested,
      pickupAddress ? JSON.stringify(pickupAddress) : null,
      req.user.id || req.user._id,
      'aberto',
    ]
  );
  return res.status(201).json(inserted.rows[0]);
});

// @desc    Obter tickets do usuário autenticado
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const pool = getPool();
  if (req.user.role === 'technician') {
    const rs = await pool.query('SELECT * FROM tickets WHERE technician=$1 ORDER BY created_at DESC', [req.user.id || req.user._id]);
    return res.status(200).json(rs.rows);
  } else {
    const rs = await pool.query('SELECT * FROM tickets WHERE client=$1 ORDER BY created_at DESC', [req.user.id || req.user._id]);
    return res.status(200).json(rs.rows);
  }
});

// @desc    Obter um ticket por ID (se pertence ao usuário)
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = asyncHandler(async (req, res) => {
  const pool = getPool();
  const rs = await pool.query('SELECT * FROM tickets WHERE id=$1 LIMIT 1', [req.params.id]);
  if (!rs.rowCount) {
    res.status(404);
    throw new Error('Ticket não encontrado');
  }
  const ticket = rs.rows[0];
  const isClientOwner = String(ticket.client) === String(req.user.id || req.user._id);
  const isAssignedTech = ticket.technician && String(ticket.technician) === String(req.user.id || req.user._id);
  if (!isClientOwner && !isAssignedTech) {
    res.status(403);
    throw new Error('Acesso negado a este ticket');
  }
  return res.status(200).json(ticket);
});

// @desc    Atualizar um ticket (fechamento, status, etc.)
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = asyncHandler(async (req, res) => {
  const pool = getPool();
  const rs = await pool.query('SELECT * FROM tickets WHERE id=$1 LIMIT 1', [req.params.id]);
  if (!rs.rowCount) {
    res.status(404);
    throw new Error('Ticket não encontrado');
  }
  const ticket = rs.rows[0];
  const isClientOwner = String(ticket.client) === String(req.user.id || req.user._id);
  const isAssignedTech = ticket.technician && String(ticket.technician) === String(req.user.id || req.user._id);
  if (!isClientOwner && !isAssignedTech) {
    res.status(403);
    throw new Error('Acesso negado para atualizar este ticket');
  }
  const allowedUpdates = ['status', 'finalReport', 'serviceItems', 'attachments', 'paymentStatus'];
  const updates = Object.keys(req.body).filter((k) => allowedUpdates.includes(k));
  let status = ticket.status;
  let completionDate = ticket.completion_date;
  let serviceItems = ticket.service_items || [];
  let attachments = ticket.attachments || [];
  let finalReport = ticket.final_report || null;
  let paymentStatus = ticket.payment_status || null;
  updates.forEach((key) => {
    if (key === 'status') {
      let next = req.body.status;
      if (next === 'closed') next = 'concluido';
      status = next;
      if (next === 'concluido') completionDate = new Date();
    } else if (key === 'serviceItems') {
      serviceItems = Array.isArray(req.body.serviceItems) ? req.body.serviceItems : serviceItems;
    } else if (key === 'attachments') {
      attachments = Array.isArray(req.body.attachments) ? req.body.attachments : attachments;
    } else if (key === 'finalReport') {
      finalReport = req.body.finalReport;
    } else if (key === 'paymentStatus') {
      paymentStatus = req.body.paymentStatus;
    }
  });
  const totalPrice = (serviceItems || []).reduce((sum, item) => sum + (item.price || 0), 0);
  await pool.query(
    'UPDATE tickets SET status=$1, final_report=$2, service_items=$3, attachments=$4, payment_status=$5, completion_date=$6, total_price=$7 WHERE id=$8',
    [status, finalReport, JSON.stringify(serviceItems), JSON.stringify(attachments), paymentStatus, completionDate, totalPrice, req.params.id]
  );
  const rsUpdated = await pool.query('SELECT * FROM tickets WHERE id=$1', [req.params.id]);
  return res.status(200).json(rsUpdated.rows[0]);
});

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  getTicketsReport: async (req, res) => {
    const { getPool } = require('../db/pgClient');
    const pool = getPool();
    const userId = req.user.id || req.user._id;
    const role = req.user.role;
    const { groupBy = 'month', from, to, status } = req.query;
    const where = [];
    if (role === 'client') where.push('client=$1'); else where.push('technician=$1');
    const params = [userId];
    if (from) { params.push(new Date(from)); where.push(`created_at >= $${params.length}`); }
    if (to) { params.push(new Date(to)); where.push(`created_at <= $${params.length}`); }
    if (status) { params.push(status); where.push(`status=$${params.length}`); }
    let bucket;
    if (groupBy === 'day') bucket = `TO_CHAR(created_at, 'YYYY-MM-DD')`;
    else if (groupBy === 'year') bucket = `TO_CHAR(created_at, 'YYYY')`;
    else bucket = `TO_CHAR(created_at, 'YYYY-MM')`;
    const sql = `SELECT ${bucket} AS period, COUNT(*) AS count, COALESCE(SUM(total_price),0) AS total
                 FROM tickets
                 WHERE ${where.join(' AND ')}
                 GROUP BY period
                 ORDER BY period ASC`;
    const rs = await pool.query(sql, params);
    res.json({ groupBy, from, to, status, rows: rs.rows });
  },
};