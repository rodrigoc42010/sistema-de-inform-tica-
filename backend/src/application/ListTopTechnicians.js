const technicianRepository = require('../infrastructure/database/PostgresTechnicianRepository');

class ListTopTechnicians {
  async execute({ city, state, limit }) {
    return await technicianRepository.findTop(city, state, limit);
  }
}

module.exports = new ListTopTechnicians();
