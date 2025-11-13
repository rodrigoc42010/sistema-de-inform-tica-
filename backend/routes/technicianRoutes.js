const express = require('express');
const router = express.Router();
const { protect, clientOnly } = require('../middleware/authMiddleware');
const Technician = require('../models/technicianModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

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

    const tech = await Technician.findOne({ userId: technicianId }) || await Technician.findById(technicianId);
    if (!tech) return res.status(404).json({ message: 'Técnico não encontrado' });

    // Evitar avaliações duplicadas do mesmo cliente para o mesmo ticket
    const alreadyReviewed = tech.reviews?.some(r => String(r.ticketId) === String(ticketId) && String(r.clientId) === String(req.user._id));
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Você já avaliou este ticket' });
    }

    tech.reviews = tech.reviews || [];
    tech.reviews.push({ ticketId, clientId: req.user._id, rating, comment });

    // Atualizar agregados
    const total = (tech.totalReviews || 0) + 1;
    const newAvg = ((tech.rating || 0) * (tech.totalReviews || 0) + rating) / total;
    tech.totalReviews = total;
    tech.rating = Number(newAvg.toFixed(2));

    await tech.save();

    res.status(201).json({ message: 'Avaliação registrada com sucesso', rating: tech.rating, totalReviews: tech.totalReviews });
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
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    if (isDemo || !isDbConnected) {
      return res.json([]);
    }

    const match = {};
    if (city) match['address.city'] = city;
    if (state) match['address.state'] = state;

    // Encontrar usuários (tecnicos) pela região
    const users = await User.find({ role: 'technician', ...match }).select('_id name address');
    const userIds = users.map((u) => u._id);

    const technicians = await Technician.find({ userId: { $in: userIds } })
      .sort({ rating: -1, totalReviews: -1 })
      .limit(limit);

    // Enriquecer com dados do usuário
    const result = technicians.map((t) => {
      const u = users.find((x) => String(x._id) === String(t.userId));
      return {
        technicianId: t._id,
        userId: t.userId,
        name: u?.name,
        city: u?.address?.city,
        state: u?.address?.state,
        rating: t.rating,
        totalReviews: t.totalReviews,
        specialties: t.specialties || [],
      };
    });

    return res.json(result);
  } catch (err) {
    // Em falha inesperada, retornar lista vazia para evitar 500
    try {
      return res.json([]);
    } catch (e) {
      return next(err);
    }
  }
});

module.exports = router;