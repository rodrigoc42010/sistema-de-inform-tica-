const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
} = require('../controllers/ticketController');

// Alias de Ordem de Serviço (OS) para compatibilidade com linguagem de negócio
router.get('/', protect, getTickets);
router.post('/', protect, createTicket);
router.get('/:id', protect, getTicket);
router.put('/:id', protect, updateTicket);

module.exports = router;
