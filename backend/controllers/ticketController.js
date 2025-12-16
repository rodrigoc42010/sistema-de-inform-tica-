const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');
const ticketRepository = require('../repositories/ticketRepository');
const {
  checkTicketAccess,
  checkTicketUpdatePermission,
  getTicketAllowedFields,
} = require('../utils/authorization/ticketAuth');
const ticketService = require('../services/ticketService');

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
    technician,
  } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Título e descrição são obrigatórios');
  }

  const inserted = await ticketService.createTicket(req.body, req.userId);
  return res.status(201).json(inserted);
});

// @desc    Obter tickets do usuário autenticado
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const pool = getPool();
  if (req.user.role === 'technician') {
    const tickets = await ticketRepository.findAllByTechnician(req.userId);
    return res.status(200).json(tickets);
  } else {
    const tickets = await ticketRepository.findAllByClient(req.userId);
    return res.status(200).json(tickets);
  }
});

// @desc    Obter um ticket por ID (se pertence ao usuário)
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = asyncHandler(async (req, res) => {
  const pool = getPool();
  const ticket = await ticketRepository.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket não encontrado');
  }
  checkTicketAccess(ticket, req.userId);
  return res.status(200).json(ticket);
});

// @desc    Atualizar um ticket (fechamento, status, etc.)
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = asyncHandler(async (req, res) => {
  const pool = getPool();
  const ticket = await ticketRepository.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket não encontrado');
  }
  checkTicketAccess(ticket, req.userId);

  const allowedUpdates = getTicketAllowedFields(req.user.role);

  const updates = Object.keys(req.body).filter((k) =>
    allowedUpdates.includes(k)
  );

  // Validação adicional: permissões de atualização (ex: paymentStatus)
  checkTicketUpdatePermission(ticket, req.user, req.body);

  const updatedTicket = await ticketService.updateTicket(
    req.params.id,
    req.body,
    ticket,
    req.userId
  );

  console.log(
    `[TICKETS] Ticket ${req.params.id} atualizado por ${req.user.role} ${req.user.id}`
  );
  return res.status(200).json(updatedTicket);
});

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  getTicketsReport: async (req, res) => {
    const reportService = require('../services/reportService');
    const userId = req.userId;
    const role = req.user.role;
    const { groupBy = 'month', from, to, status } = req.query;

    const rows = await reportService.generateReport(
      'tickets',
      { userId, role, from, to, status },
      groupBy,
      'total_price'
    );

    res.json({ groupBy, from, to, status, rows });
  },
};
