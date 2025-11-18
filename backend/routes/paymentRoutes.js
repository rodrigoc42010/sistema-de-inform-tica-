const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPayments, updatePaymentStatus, getPaymentsReport } = require('../controllers/paymentController');

// Rota temporária para teste
router.get('/', protect, getPayments);
router.put('/:id/status', protect, updatePaymentStatus);
router.get('/report', protect, getPaymentsReport);

module.exports = router;