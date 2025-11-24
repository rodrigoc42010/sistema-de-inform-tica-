const express = require('express');
const router = express.Router();
const {
    getLocalServices,
    getExternalServiceDetails
} = require('../controllers/localServicesController');

// @route   GET /api/services/local
// @desc    Buscar serviços locais (técnicos + Google Places)
// @access  Public
router.get('/local', getLocalServices);

// @route   GET /api/services/external/:placeId
// @desc    Buscar detalhes de serviço externo
// @access  Public
router.get('/external/:placeId', getExternalServiceDetails);

module.exports = router;
