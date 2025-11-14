const asyncHandler = require('express-async-handler');
const Ticket = require('../models/ticketModel');
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

  const usePg = (process.env.DB_TYPE || '').toLowerCase() === 'postgres' || !!process.env.DATABASE_URL;
  if (usePg) {
    const pool = getPool();
    const inserted = await pool.query(
      'INSERT INTO tickets (title,description,priority,device_type,device_brand,device_model,problem_category,attachments,service_items,initial_diagnosis,pickup_requested,pickup_address,client,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
      [
        title,
        description,
        priority || null,
        deviceType || null,
        deviceBrand || null,
        deviceModel || null,
        problemCategory || null,
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
  }
  const ticket = await Ticket.create({
    title,
    description,
    priority,
    deviceType,
    deviceBrand,
    deviceModel,
    problemCategory,
    attachments: Array.isArray(attachments) ? attachments : [],
    serviceItems: Array.isArray(serviceItems) ? serviceItems : [],
    initialDiagnosis,
    pickupRequested: !!pickupRequested,
    pickupAddress,
    client: req.user._id,
    status: 'aberto',
  });
  res.status(201).json(ticket);
});

// @desc    Obter tickets do usuário autenticado
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const usePg = (process.env.DB_TYPE || '').toLowerCase() === 'postgres' || !!process.env.DATABASE_URL;
  if (usePg) {
    const pool = getPool();
    if (req.user.role === 'technician') {
      const rs = await pool.query('SELECT * FROM tickets WHERE technician=$1 ORDER BY created_at DESC', [req.user.id || req.user._id]);
      return res.status(200).json(rs.rows);
    } else {
      const rs = await pool.query('SELECT * FROM tickets WHERE client=$1 ORDER BY created_at DESC', [req.user.id || req.user._id]);
      return res.status(200).json(rs.rows);
    }
  }
  let query = {};
  if (req.user.role === 'technician') {
    query.technician = req.user._id;
  } else {
    query.client = req.user._id;
  }
  const tickets = await Ticket.find(query).sort({ createdAt: -1 });
  res.status(200).json(tickets);
});

// @desc    Obter um ticket por ID (se pertence ao usuário)
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = asyncHandler(async (req, res) => {
  const usePg = (process.env.DB_TYPE || '').toLowerCase() === 'postgres' || !!process.env.DATABASE_URL;
  if (usePg) {
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
  }
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket não encontrado');
  }

  const isClientOwner = ticket.client?.toString() === req.user._id.toString();
  const isAssignedTech = ticket.technician?.toString() === req.user._id.toString();

  if (!isClientOwner && !isAssignedTech) {
    res.status(403);
    throw new Error('Acesso negado a este ticket');
  }

  res.status(200).json(ticket);
});

// @desc    Atualizar um ticket (fechamento, status, etc.)
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = asyncHandler(async (req, res) => {
  const usePg = (process.env.DB_TYPE || '').toLowerCase() === 'postgres' || !!process.env.DATABASE_URL;
  if (usePg) {
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
  }
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket não encontrado');
  }

  const isClientOwner = ticket.client?.toString() === req.user._id.toString();
  const isAssignedTech = ticket.technician?.toString() === req.user._id.toString();

  if (!isClientOwner && !isAssignedTech) {
    res.status(403);
    throw new Error('Acesso negado para atualizar este ticket');
  }

  // Apenas alguns campos podem ser atualizados por este endpoint
  const allowedUpdates = ['status', 'finalReport', 'serviceItems', 'attachments', 'paymentStatus'];
  const updates = Object.keys(req.body).filter((k) => allowedUpdates.includes(k));

  updates.forEach((key) => {
    if (key === 'status') {
      // Mapear status do frontend ("closed") para enum do backend ("concluido")
      let nextStatus = req.body.status;
      if (nextStatus === 'closed') nextStatus = 'concluido';
      ticket.status = nextStatus;

      if (nextStatus === 'concluido') {
        ticket.completionDate = new Date();
      }
    } else if (key === 'serviceItems') {
      ticket.serviceItems = Array.isArray(req.body.serviceItems)
        ? req.body.serviceItems
        : ticket.serviceItems;
      // Atualiza preço total sempre que serviceItems mudar
      ticket.totalPrice = (ticket.serviceItems || []).reduce((sum, item) => sum + (item.price || 0), 0);
    } else if (key === 'attachments') {
      ticket.attachments = Array.isArray(req.body.attachments)
        ? req.body.attachments
        : ticket.attachments;
    } else if (key === 'finalReport') {
      ticket.finalReport = req.body.finalReport;
    } else if (key === 'paymentStatus') {
      ticket.paymentStatus = req.body.paymentStatus;
    }
  });

  const updated = await ticket.save();
  res.status(200).json(updated);
});

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
};