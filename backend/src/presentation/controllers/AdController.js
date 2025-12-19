const createAd = require('../../application/CreateAd');
const payAd = require('../../application/PayAd');
const adRepository = require('../../infrastructure/database/PostgresAdRepository');
const asyncHandler = require('express-async-handler');

class AdController {
  create = asyncHandler(async (req, res) => {
    const ad = await createAd.execute({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(ad);
  });

  pay = asyncHandler(async (req, res) => {
    const ad = await payAd.execute({
      adId: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json(ad);
  });

  listActive = asyncHandler(async (req, res) => {
    const audience = req.user ? req.user.role : 'client';
    const ads = await adRepository.findAllActive(audience);
    res.status(200).json(ads);
  });

  listPublic = asyncHandler(async (req, res) => {
    const ads = await adRepository.findAllActive('client');
    res.status(200).json(ads);
  });

  getMyAds = asyncHandler(async (req, res) => {
    const ads = await adRepository.findByCreator(req.user.id);
    res.status(200).json(ads);
  });

  update = asyncHandler(async (req, res) => {
    const ad = await adRepository.findById(req.params.id);
    if (!ad || String(ad.createdBy) !== String(req.user.id)) {
      res.status(403);
      throw new Error('Não autorizado');
    }
    const updated = await adRepository.update(req.params.id, req.body);
    res.status(200).json(updated);
  });
}

module.exports = new AdController();
