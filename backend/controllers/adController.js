const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');

// Criar anúncio (técnico)
// POST /api/ads
// Private (technician)
// Tabela de preços (em BRL)
const AD_PRICING = {
  basic: { 7: 19.90, 15: 34.90, 30: 59.90 },
  intermediate: { 7: 29.90, 15: 54.90, 30: 99.90 },
  premium: { 7: 49.90, 15: 89.90, 30: 159.90 }
};

// Criar anúncio (técnico)
// POST /api/ads
// Private (technician)
const createAd = asyncHandler(async (req, res) => {
  const { title, text, linkUrl, mediaUrl, audience, tier = 'basic', duration = 30 } = req.body;

  if (!title || !text) {
    res.status(400);
    throw new Error('Título e texto são obrigatórios');
  }

  // Validar plano e duração
  const validTiers = ['basic', 'intermediate', 'premium'];
  const validDurations = [7, 15, 30];

  const selectedTier = validTiers.includes(tier) ? tier : 'basic';
  const selectedDuration = validDurations.includes(Number(duration)) ? Number(duration) : 30;

  // Calcular preço
  const price = AD_PRICING[selectedTier][selectedDuration];

  const pool = getPool();

  // Inserir como pendente de pagamento
  const inserted = await pool.query(
    'INSERT INTO ads (title,text,link_url,media_url,audience,tier,duration_days,price,payment_status,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
    [
      title,
      text,
      linkUrl || null,
      mediaUrl || null,
      audience || 'client',
      selectedTier,
      selectedDuration,
      price,
      'pending',
      'pending_payment',
      req.user.id || req.user._id
    ]
  );

  const ad = inserted.rows[0];
  res.status(201).json(ad);
});

// Simular pagamento e ativar anúncio
// POST /api/ads/:id/pay
// Private (technician)
const payAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pool = getPool();

  const rs = await pool.query('SELECT * FROM ads WHERE id=$1 LIMIT 1', [id]);
  const ad = rs.rowCount ? rs.rows[0] : null;

  if (!ad) {
    res.status(404);
    throw new Error('Anúncio não encontrado');
  }

  if (String(ad.created_by) !== String(req.user.id || req.user._id)) {
    res.status(403);
    throw new Error('Permissão negada');
  }

  if (ad.status === 'active') {
    return res.status(200).json(ad);
  }

  // Calcular datas
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + ad.duration_days);

  // Atualizar para pago e ativo
  await pool.query(
    'UPDATE ads SET payment_status=$1, status=$2, start_date=$3, end_date=$4 WHERE id=$5',
    ['paid', 'active', startDate, endDate, id]
  );

  // Registrar pagamento no histórico
  try {
    await pool.query(
      'INSERT INTO payments (type, ad, technician, amount, currency, payment_method, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      ['ad_fee', ad.id, req.user.id || req.user._id, ad.price, 'BRL', 'simulation', 'paid', `Pagamento Anúncio ${ad.tier} (${ad.duration_days} dias)`]
    );
  } catch (e) {
    console.warn('Erro ao registrar log de pagamento:', e);
  }

  const updated = await pool.query('SELECT * FROM ads WHERE id=$1', [id]);
  res.status(200).json(updated.rows[0]);
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

  const pool2 = getPool();
  const rs2 = await pool2.query(
    `SELECT * FROM ads WHERE active=TRUE AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()) AND (audience='all' OR audience=$1) ORDER BY created_at DESC LIMIT 50`,
    [role]
  );
  return res.status(200).json(rs2.rows);
});

// Listar anúncios públicos (sem autenticação)
// GET /api/ads/public
// Public
const listPublicAds = asyncHandler(async (req, res) => {
  const now = new Date();
  const pool3 = getPool();
  const rs3 = await pool3.query(
    `SELECT * FROM ads WHERE active=TRUE AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()) AND (audience='all' OR audience='client') ORDER BY created_at DESC LIMIT 50`
  );
  return res.status(200).json(rs3.rows);
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
  const PRICE_PER_MONTH = Number(process.env.AD_FREE_PRICE_PER_MONTH_BRL || '9.9');
  const amount = Math.round(PRICE_PER_MONTH * months * 100) / 100;

  // Atualiza o campo adFreeUntil
  const base = req.user.adFreeUntil && new Date(req.user.adFreeUntil) > new Date() ? new Date(req.user.adFreeUntil) : new Date();
  base.setMonth(base.getMonth() + Number(months));
  const pool4 = getPool();
  await pool4.query('UPDATE users SET ad_free_until=$1 WHERE id=$2', [base, req.user.id || req.user._id]);

  // Integração Stripe (opcional; retorna clientSecret se configurado)
  let stripeInfo = null;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    try {
      const stripe = require('stripe')(stripeKey);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: (process.env.STRIPE_CURRENCY || 'brl'),
        automatic_payment_methods: { enabled: true },
        metadata: { userId: String(req.user.id || req.user._id), months: String(months) },
      });
      stripeInfo = { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
      try {
        await pool4.query('INSERT INTO payments (type, client, amount, currency, payment_method, status, payment_intent_id, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', ['ad_free', req.user.id || req.user._id, amount, process.env.STRIPE_CURRENCY || 'BRL', 'stripe', 'processando', paymentIntent.id, `Ad-free por ${months} mês(es)`]);
      } catch (e) {
        console.warn('Falha ao registrar pagamento Stripe:', e?.message || e);
      }
    } catch (e) {
      console.warn('Stripe não configurado corretamente:', e?.message || e);
    }
  }

  res.status(200).json({
    message: 'Remoção de anúncios ativada',
    adFreeUntil: base,
    amountCharged: amount,
    currency: 'BRL',
    stripe: stripeInfo,
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
  const pool5 = getPool();
  const rs5 = await pool5.query('SELECT * FROM ads WHERE created_by=$1 ORDER BY created_at DESC', [req.user.id || req.user._id]);
  return res.status(200).json(rs5.rows);
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
  const pool = getPool();
  const rs = await pool.query('SELECT * FROM ads WHERE id=$1 LIMIT 1', [id]);
  const ad = rs.rowCount ? rs.rows[0] : null;
  if (!ad) {
    res.status(404);
    throw new Error('Anúncio não encontrado');
  }
  if (String((ad.createdBy || ad.created_by)) !== String(req.user._id || req.user.id)) {
    res.status(403);
    throw new Error('Você não tem permissão para editar este anúncio');
  }

  // Whitelist estrita de colunas permitidas (previne SQL injection)
  const ALLOWED_UPDATES = {
    title: 'title',
    text: 'text',
    linkUrl: 'link_url',
    mediaUrl: 'media_url',
    audience: 'audience',
    startDate: 'start_date',
    endDate: 'end_date',
    active: 'active'
  };

  const sets = [];
  const values = [];
  let paramIndex = 1;

  // Apenas processar campos permitidos
  Object.keys(req.body).forEach((key) => {
    if (ALLOWED_UPDATES[key]) {
      sets.push(`${ALLOWED_UPDATES[key]}=$${paramIndex}`);
      values.push(req.body[key]);
      paramIndex++;
    }
  });

  if (sets.length === 0) {
    return res.status(400).json({ message: 'Nenhum campo válido para atualizar' });
  }

  values.push(id); // ID sempre por último
  const updateQuery = `UPDATE ads SET ${sets.join(', ')} WHERE id=$${paramIndex}`;

  await pool.query(updateQuery, values);
  const rsUpdated = await pool.query('SELECT * FROM ads WHERE id=$1', [id]);

  console.log(`[ADS] Anúncio atualizado: ${id} por usuário ${req.user.id}`);
  return res.status(200).json(rsUpdated.rows[0]);
});

module.exports = {
  createAd,
  listActiveAds,
  purchaseAdRemoval,
  listPublicAds,
  getMyAds,
  updateAd,
  payAd,
};