const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/ServiceController');
const { protect } = require('../middlewares/AuthMiddleware');

router.get('/local', protect, serviceController.getLocalServices);

module.exports = router;
