const asyncHandler = require('express-async-handler');
const Ad = require('../models/adModel');
const Payment = require('../models/paymentModel');
const mongoose = require('mongoose');

// Criar anúncio (técnico)
// POST /api/ads
// Private (technician)
const createAd = asyncHandler(async (req, res) => {
  const { title, text, linkUrl, mediaUrl, audience, startDate, endDate } = req.body;
  if (!title || !text) {
    res.status(400);
    throw new Error('Título e texto são obrigatórios');
  }
  const ad = await Ad.create({
    title,
    text,
    linkUrl,
    mediaUrl,
    audience: audience || 'client',
    startDate,
    endDate,
    createdBy: req.user._id,
  });

  // Registrar taxa de postagem de anúncio (pendente), para administração/recebimento
  try {
    const feeAmount = Number(process.env.AD_POST_FEE_BRL || '4.9');
    await Payment.create({
      type: 'ad_fee',
      ad: ad._id,
      technician: req.user._id,
      amount: feeAmount,
      currency: 'BRL',
      paymentMethod: 'admin_fee',
      status: 'pendente',
      notes: `Taxa de postagem de anúncio: ${ad.title}`,
    });
  } catch (e) {
    // Não bloquear criação do anúncio por falha ao registrar pagamento
    console.warn('Falha ao registrar taxa de anúncio:', e?.message || e);
  }
  res.status(201).json(ad);
});

// Listar anúncios ativos para o usuário atual (respeita adFree para clientes)
// GET /api/ads
// Private
const listActiveAds = asyncHandler(async (req, res) => {
  const now = new Date();
  const role = req.user.role;

  // Se cliente com adFree até o futuro, não retorna anúncios
  if (role === 'client' && req.user.adFreeUntil && new Date(req.user.adFreeUntil) > now) {
    return res.status(200).json([]);
  }

  const query = {
    active: true,
    $or: [
      { startDate: { $exists: false } },
      { startDate: { $lte: now } },
    ],
  };
  query.$and = [
    { $or: [ { endDate: { $exists: false } }, { endDate: { $gte: now } } ] },
    { $or: [ { audience: 'all' }, { audience: role } ] },
  ];

  const ads = await Ad.find(query).sort({ createdAt: -1 }).limit(50);
  res.status(200).json(ads);
});

// Listar anúncios públicos (sem autenticação)
// GET /api/ads/public
// Public
const listPublicAds = asyncHandler(async (req, res) => {
  const now = new Date();
  const query = {
    active: true,
    $or: [
      { startDate: { $exists: false } },
      { startDate: { $lte: now } },
    ],
  };
  query.$and = [
    { $or: [ { endDate: { $exists: false } }, { endDate: { $gte: now } } ] },
    { $or: [ { audience: 'all' }, { audience: 'client' } ] },
  ];

  const ads = await Ad.find(query).sort({ createdAt: -1 }).limit(50);
  res.status(200).json(ads);
});

// Comprar remoção de anúncios (cliente)
// POST /api/ads/purchase-remove
// Private (client)
const purchaseAdRemoval = asyncHandler(async (req, res) => {
  const { months = 1 } = req.body;
  if (req.user.role !== 'client') {
    res.status(403);
    throw new Error('Apenas clientes podem comprar remoção de anúncios');
  }
  // Valor fixo por mês (pode ser integrado ao Stripe no futuro)
  const PRICE_PER_MONTH = 9.9; // BRL
  const amount = Math.round(PRICE_PER_MONTH * months * 100) / 100;

  // Atualiza o campo adFreeUntil
  const base = req.user.adFreeUntil && new Date(req.user.adFreeUntil) > new Date() ? new Date(req.user.adFreeUntil) : new Date();
  base.setMonth(base.getMonth() + Number(months));

  const User = require('../models/userModel');
  const user = await User.findById(req.user._id);
  user.adFreeUntil = base;
  await user.save();

  res.status(200).json({
    message: 'Remoção de anúncios ativada',
    adFreeUntil: user.adFreeUntil,
    amountCharged: amount,
    currency: 'BRL',
  });
});

// Listar anúncios criados pelo técnico atual
// GET /api/ads/mine
// Private (technician)
const getMyAds = asyncHandler(async (req, res) => {
  if (req.user.role !== 'technician') {
    res.status(403);
    throw new Error('Apenas técnicos podem listar seus anúncios');
  }
  const ads = await Ad.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(ads);
});

// Atualizar anúncio existente (somente autor)
// PUT /api/ads/:id
// Private (technician)
const updateAd = asyncHandler(async (req, res) => {
  if (req.user.role !== 'technician') {
    res.status(403);
    throw new Error('Apenas técnicos podem atualizar anúncios');
  }
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('ID inválido');
  }
  const ad = await Ad.findById(id);
  if (!ad) {
    res.status(404);
    throw new Error('Anúncio não encontrado');
  }
  if (String(ad.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Você não tem permissão para editar este anúncio');
  }

  const allowedFields = ['title', 'text', 'linkUrl', 'mediaUrl', 'audience', 'startDate', 'endDate', 'active'];
  allowedFields.forEach((field) => {
    if (field in req.body) {
      ad[field] = req.body[field];
    }
  });

  await ad.save();
  res.status(200).json(ad);
});

module.exports = {
  createAd,
  listActiveAds,
  purchaseAdRemoval,
  listPublicAds,
  getMyAds,
  updateAd,
};