const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Rota temporária para teste
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Rotas de pagamentos funcionando' });
});

// Aqui serão implementadas as rotas para pagamentos
// como processamento, histórico, etc.

module.exports = router;