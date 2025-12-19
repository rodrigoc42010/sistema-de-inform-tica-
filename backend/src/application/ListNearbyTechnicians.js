const technicianRepository = require('../infrastructure/database/PostgresTechnicianRepository');
const placesService = require('../../services/placesService');

class ListNearbyTechnicians {
  async execute({ lat, lng, radiusKm = 10 }) {
    if (!lat || !lng) {
      throw new Error('Latitude e longitude são obrigatórias');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radius = parseFloat(radiusKm);

    // 1. Buscar técnicos cadastrados no banco
    const registeredTechnicians = await technicianRepository.findNearby(
      latitude,
      longitude,
      radius
    );

    // Marcar como cadastrados e formatar
    const formattedRegistered = registeredTechnicians.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.bio,
      phone: t.phone,
      email: t.email,
      rating: t.ratingAverage,
      distance: parseFloat(t.distance.toFixed(2)),
      isRegistered: true,
      canRequestService: true,
      specialties: [], // Pode ser expandido se houver tabela de especialidades
    }));

    // 2. Buscar assistências no Google Maps (Places API)
    // Converter km para metros para a API do Google
    const externalPlaces = await placesService.searchNearby(
      latitude,
      longitude,
      radius * 1000
    );

    const formattedExternal = externalPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      rating: p.rating,
      latitude: p.latitude,
      longitude: p.longitude,
      distance: 0,
      isRegistered: false,
      canRequestService: false,
      isExternal: true,
    }));

    // Calcular distância para os externos também para manter consistência
    formattedExternal.forEach((p) => {
      p.distance = parseFloat(
        this._calculateDistance(
          latitude,
          longitude,
          p.latitude,
          p.longitude
        ).toFixed(2)
      );
    });

    // 3. Combinar e ordenar por distância
    const allServices = [...formattedRegistered, ...formattedExternal].sort(
      (a, b) => a.distance - b.distance
    );

    return {
      services: allServices,
      total: allServices.length,
      counts: {
        registered: formattedRegistered.length,
        external: formattedExternal.length,
      },
    };
  }

  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = new ListNearbyTechnicians();
