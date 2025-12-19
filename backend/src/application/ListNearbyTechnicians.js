const technicianRepository = require('../infrastructure/database/PostgresTechnicianRepository');

class ListNearbyTechnicians {
  async execute({ lat, lng, radiusKm = 10 }) {
    if (!lat || !lng) {
      throw new Error('Latitude e longitude são obrigatórias');
    }
    return await technicianRepository.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radiusKm)
    );
  }
}

module.exports = new ListNearbyTechnicians();
