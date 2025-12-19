const technicianRepository = require('../infrastructure/database/PostgresTechnicianRepository');
const redisService = require('../infrastructure/external/RedisService');

class ListTechnicians {
  async execute() {
    const cacheKey = 'technicians:active';
    const cached = await redisService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const technicians = await technicianRepository.findAllActive();

    // Cache for 5 minutes
    await redisService.set(cacheKey, technicians, 300);

    return technicians;
  }
}

module.exports = new ListTechnicians();
