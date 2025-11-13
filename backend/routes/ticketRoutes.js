const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
} = require('../controllers/ticketController');

// Listar tickets do usuário autenticado
router.get('/', protect, getTickets);

// Criar novo ticket
router.post('/', protect, createTicket);

// Obter um ticket por ID
router.get('/:id', protect, getTicket);

// Atualizar ticket (inclui fechamento via status)
router.put('/:id', protect, updateTicket);

module.exports = router;