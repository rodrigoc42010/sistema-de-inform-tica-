const express = require('express');
const router = express.Router();
const { protect, clientOnly } = require('../middleware/authMiddleware');
const { getPool } = require('../db/pgClient');

// Rota temporária para teste
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Rotas de técnicos funcionando' });
});

// Adicionar avaliação de técnico por ticket concluído
router.post('/:technicianId/reviews', protect, clientOnly, async (req, res, next) => {
  try {
    const { technicianId } = req.params;
    const { ticketId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating inválido. Use 1 a 5.' });
    }

    const pool = getPool();
    let rsTech = await pool.query('SELECT * FROM technicians WHERE user_id=$1 LIMIT 1', [technicianId]);
    if (!rsTech.rowCount) rsTech = await pool.query('SELECT * FROM technicians WHERE id=$1 LIMIT 1', [technicianId]);
    if (!rsTech.rowCount) return res.status(404).json({ message: 'Técnico não encontrado' });
    const tech = rsTech.rows[0];
    const reviews = Array.isArray(tech.reviews) ? tech.reviews : [];
    const alreadyReviewed = reviews.some(r => String(r.ticketId) === String(ticketId) && String(r.clientId) === String(req.user.id || req.user._id));
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Você já avaliou este ticket' });
    }
    reviews.push({ ticketId, clientId: req.user.id || req.user._id, rating, comment, createdAt: new Date().toISOString() });
    const total = (tech.total_reviews || 0) + 1;
    const newAvg = ((Number(tech.rating) || 0) * (tech.total_reviews || 0) + rating) / total;
    await pool.query('UPDATE technicians SET reviews=$1, total_reviews=$2, rating=$3 WHERE id=$4', [JSON.stringify(reviews), total, Number(newAvg.toFixed(2)), tech.id]);
    return res.status(201).json({ message: 'Avaliação registrada com sucesso', rating: Number(newAvg.toFixed(2)), totalReviews: total });
  } catch (err) {
    next(err);
  }
});

// Obter top técnicos por região
router.get('/top', async (req, res, next) => {
  try {
    const { city, state } = req.query;
    const limit = Number(req.query.limit || 5) || 5;

    // Fallback: modo demonstração ou banco de dados indisponível
    const isDemo = process.env.DEMO_MODE === 'true';
    if (isDemo) {
      return res.json([]);
    }
    const pool = getPool();
    const conds = ['role=$1'];
    const params = ['technician'];
    let idx = 2;
    if (city) { conds.push(`(address->>'city')=$${idx++}`); params.push(city); }
    if (state) { conds.push(`(address->>'state')=$${idx++}`); params.push(state); }
    const rsUsers = await pool.query(`SELECT id,name,address FROM users WHERE ${conds.join(' AND ')} LIMIT 500`, params);
    const userIds = rsUsers.rows.map(r => r.id);
    if (userIds.length === 0) return res.json([]);
    const rsTech = await pool.query('SELECT * FROM technicians WHERE user_id = ANY($1) ORDER BY rating DESC, total_reviews DESC LIMIT $2', [userIds, limit]);
    const result = rsTech.rows.map((t) => {
      const u = rsUsers.rows.find((x) => String(x.id) === String(t.user_id));
      return {
        technicianId: t.id,
        userId: t.user_id,
        name: u?.name,
        city: u?.address?.city,
        state: u?.address?.state,
        rating: Number(t.rating || 0),
        totalReviews: Number(t.total_reviews || 0),
        specialties: t.specialties || [],
      };
    });
    return res.json(result);
  } catch (err) {
    // Em falha inesperada, retornar lista vazia para evitar 500
    try { return res.json([]); } catch (e) { return next(err); }
  }
});

module.exports = router;