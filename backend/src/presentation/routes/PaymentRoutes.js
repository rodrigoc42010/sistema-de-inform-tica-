const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');
const { protect } = require('../middlewares/AuthMiddleware');

router.get('/', protect, paymentController.list);

module.exports = router;
