const listNearbyTechnicians = require('../../application/ListNearbyTechnicians');
const asyncHandler = require('express-async-handler');

class ServiceController {
  getLocalServices = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius } = req.query;

    console.log(
      `[ServiceController] Fetching local services for lat: ${latitude}, lng: ${longitude}, radius: ${radius}km`
    );

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn(
        '[ServiceController] GOOGLE_MAPS_API_KEY is not set in environment variables'
      );
    }

    const result = await listNearbyTechnicians.execute({
      lat: latitude,
      lng: longitude,
      radiusKm: radius,
    });

    console.log(
      `[ServiceController] Found ${result.counts.registered} registered and ${result.counts.external} external services`
    );

    res.status(200).json(result);
  });
}

module.exports = new ServiceController();
