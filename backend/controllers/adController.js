const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');

// Criar anúncio (técnico)
// POST /api/ads
// Private (technician)
const createAd = asyncHandler(async (req, res) => {
  const { title, text, linkUrl, mediaUrl, audience, startDate, endDate } = req.body;
  if (!title || !text) {
    res.status(400);
    throw new Error('Título e texto são obrigatórios');
  }
  const pool = getPool();
  const inserted = await pool.query(
    'INSERT INTO ads (title,text,link_url,media_url,audience,start_date,end_date,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [title, text, linkUrl || null, mediaUrl || null, audience || 'client', startDate || null, endDate || null, req.user.id || req.user._id]
  );
  const ad = inserted.rows[0];

  // Registrar taxa de postagem de anúncio (pendente), para administração/recebimento
  try {
    const feeAmount = Number(process.env.AD_POST_FEE_BRL || '4.9');
    await pool.query('INSERT INTO payments (type, ad, technician, amount, currency, payment_method, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', ['ad_fee', ad.id, req.user.id || req.user._id, feeAmount, 'BRL', 'admin_fee', 'pendente', `Taxa de postagem de anúncio: ${title}`]);
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

  const allowedFields = ['title', 'text', 'linkUrl', 'mediaUrl', 'audience', 'startDate', 'endDate', 'active'];
  allowedFields.forEach((field) => {
    if (field in req.body) {
      ad[field] = req.body[field];
    }
  });

  const fields = {};
  allowedFields.forEach((f) => { if (f in req.body) fields[f] = req.body[f]; });
  const colMap = { title: 'title', text: 'text', linkUrl: 'link_url', mediaUrl: 'media_url', audience: 'audience', startDate: 'start_date', endDate: 'end_date', active: 'active' };
  const sets = [];
  const values = [];
  let idx = 1;
  Object.keys(fields).forEach((k) => { sets.push(`${colMap[k]}=$${idx++}`); values.push(fields[k]); });
  values.push(id);
  if (sets.length) await pool.query(`UPDATE ads SET ${sets.join(', ')} WHERE id=$${idx}`, values);
  const rsUpdated = await pool.query('SELECT * FROM ads WHERE id=$1', [id]);
  return res.status(200).json(rsUpdated.rows[0]);
});

module.exports = {
  createAd,
  listActiveAds,
  purchaseAdRemoval,
  listPublicAds,
  getMyAds,
  updateAd,
};