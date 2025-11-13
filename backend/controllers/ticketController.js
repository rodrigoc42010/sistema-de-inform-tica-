const asyncHandler = require('express-async-handler');
const Ticket = require('../models/ticketModel');

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