const express = require('express');
const router = express.Router();
const { protect, clientOnly } = require('../middleware/authMiddleware');
const { getPool } = require('../db/pgClient');

// Rota temporária para teste
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Rotas de técnicos funcionando' });
});

// Buscar técnicos próximos
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude e longitude são obrigatórias' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    const pool = getPool();

    // Buscar técnicos com geolocalização
    const query = `
      SELECT 
        t.id, 
        t.user_id,
        u.name, 
        t.specialties, 
        t.rating, 
        t.total_reviews,
        t.latitude, 
        t.longitude
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL
    `;

    const result = await pool.query(query);

    // Calcular distância e filtrar (cálculo simples via Haversine no JS para simplificar, 
    // idealmente seria via PostGIS mas vamos manter compatível com estrutura atual)
    const technicians = result.rows.map(tech => {
      const techLat = parseFloat(tech.latitude);
      const techLng = parseFloat(tech.longitude);

      // Fórmula de Haversine
      const R = 6371; // Raio da Terra em km
      const dLat = (techLat - latitude) * Math.PI / 180;
      const dLon = (techLng - longitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latitude * Math.PI / 180) * Math.cos(techLat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distância em km

      return {
        _id: tech.id, // Frontend espera _id ou id
        id: tech.id,
        userId: tech.user_id,
        name: tech.business_name || tech.name,
        specialties: typeof tech.specialties === 'string' ? JSON.parse(tech.specialties) : (tech.specialties || []),
        rating: parseFloat(tech.rating || 0),
        distance: parseFloat(distance.toFixed(1))
      };
    }).filter(tech => tech.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json(technicians);
  } catch (err) {
    next(err);
  }
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
    const limit = Math.min(Number(req.query.limit) || 5, 50); // Máximo 50

    // Fallback: modo demonstração ou banco de dados indisponível
    const isDemo = process.env.DEMO_MODE === 'true';
    if (isDemo) {
      return res.json([]);
    }
    const pool = getPool();

    // Construir query de forma segura com parâmetros
    const conditions = ['role=$1'];
    const params = ['technician'];
    let paramIndex = 2;

    // Validar e adicionar filtro de cidade
    if (city && typeof city === 'string' && city.trim()) {
      conditions.push(`(address->>'city')=$${paramIndex}`);
      params.push(city.trim());
      paramIndex++;
    }

    // Validar e adicionar filtro de estado
    if (state && typeof state === 'string' && state.trim()) {
      conditions.push(`(address->>'state')=$${paramIndex}`);
      params.push(state.trim());
      paramIndex++;
    }

    // Query segura com parâmetros
    const userQuery = `
      SELECT id, name, address 
      FROM users 
      WHERE ${conditions.join(' AND ')} 
      LIMIT 500
    `;

    const rsUsers = await pool.query(userQuery, params);
    const userIds = rsUsers.rows.map(r => r.id);
    if (userIds.length === 0) return res.json([]);

    const rsTech = await pool.query(
      'SELECT * FROM technicians WHERE user_id = ANY($1) ORDER BY rating DESC, total_reviews DESC LIMIT $2',
      [userIds, limit]
    );

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
    console.error('[TECHNICIANS] Erro ao buscar top técnicos:', err.message);
    // Em falha inesperada, retornar lista vazia para evitar 500
    try { return res.json([]); } catch (e) { return next(err); }
  }
});

module.exports = router;