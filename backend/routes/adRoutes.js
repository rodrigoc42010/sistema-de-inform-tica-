const express = require('express');
const router = express.Router();
const { protect, technicianOnly, clientOnly } = require('../middleware/authMiddleware');
const { createAd, listActiveAds, purchaseAdRemoval, listPublicAds, getMyAds, updateAd } = require('../controllers/adController');

// Listar anúncios ativos para o usuário logado
router.get('/', protect, listActiveAds);

// Listar anúncios públicos (sem autenticação)
router.get('/public', listPublicAds);

// Criar anúncio (somente técnicos)
router.post('/', protect, technicianOnly, createAd);

// Listar anúncios do técnico atual
router.get('/mine', protect, technicianOnly, getMyAds);

// Atualizar anúncio (somente autor)
router.put('/:id', protect, technicianOnly, updateAd);

// Pagar/Simular pagamento de anúncio
router.post('/:id/pay', protect, technicianOnly, require('../controllers/adController').payAd);

// Comprar remoção de anúncios (somente clientes)
router.post('/purchase-remove', protect, clientOnly, purchaseAdRemoval);

module.exports = router;