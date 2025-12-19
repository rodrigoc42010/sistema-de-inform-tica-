const listTechnicians = require('../../application/ListTechnicians');
const listNearbyTechnicians = require('../../application/ListNearbyTechnicians');
const listTopTechnicians = require('../../application/ListTopTechnicians');
const asyncHandler = require('express-async-handler');

class UserController {
  getTechnicians = asyncHandler(async (req, res) => {
    const technicians = await listTechnicians.execute();
    res.status(200).json(technicians);
  });

  getNearbyTechnicians = asyncHandler(async (req, res) => {
    const { lat, lng, radius } = req.query;
    const technicians = await listNearbyTechnicians.execute({
      lat,
      lng,
      radiusKm: radius,
    });
    res.status(200).json(technicians);
  });

  getTopTechnicians = asyncHandler(async (req, res) => {
    const { city, state, limit } = req.query;
    const technicians = await listTopTechnicians.execute({
      city,
      state,
      limit,
    });
    res.status(200).json(technicians);
  });

  getProfile = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
  });
}

module.exports = new UserController();
