const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPayments, updatePaymentStatus, getPaymentsReport, sendPaymentReminder, sendReceipt } = require('../controllers/paymentController');

// Rota temporária para teste
router.get('/', protect, getPayments);
router.put('/:id/status', protect, updatePaymentStatus);
router.get('/report', protect, getPaymentsReport);
router.post('/:id/remind', protect, sendPaymentReminder);
router.post('/:id/receipt', protect, sendReceipt);

module.exports = router;