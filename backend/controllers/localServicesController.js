const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');
const GeocodingService = require('../services/geocodingService');
const PlacesService = require('../services/placesService');

/**
 * @desc    Buscar serviços locais (técnicos cadastrados + Google Places)
 * @route   GET /api/services/local
 * @access  Public
 * @query   latitude, longitude, radius (km), categories
 */
const getLocalServices = asyncHandler(async (req, res) => {
  const { latitude, longitude, lat, lng, radius = 10, categories } = req.query;
  const latStr = latitude || lat;
  const lngStr = longitude || lng;

  if (!latStr || !lngStr) {
    res.status(400);
    throw new Error('Latitude e longitude são obrigatórias');
  }

  const latNum = parseFloat(latStr);
  const lngNum = parseFloat(lngStr);
  const radiusKm = parseFloat(radius);

  console.log(
    `Searching for services near (${latNum}, ${lngNum}) within ${radiusKm}km`
  );

  // 1. Buscar técnicos cadastrados no sistema
  const pool = getPool();
  const techniciansQuery = await pool.query(`
    SELECT 
      u.id AS user_id,
      t.id AS technician_id,
      u.name,
      u.email,
      u.phone,
      u.address,
      t.rating,
      t.total_reviews,
      t.specialties,
      t.services,
      t.latitude,
      t.longitude,
      t.address_street,
      t.address_number,
      t.address_city,
      t.address_state,
      t.address_zipcode
    FROM users u
    JOIN technicians t ON u.id = t.user_id
    WHERE u.role = 'technician'
  `);

  const technicians = [];
  for (const tech of techniciansQuery.rows) {
    let tLat = tech.latitude != null ? parseFloat(tech.latitude) : null;
    let tLng = tech.longitude != null ? parseFloat(tech.longitude) : null;

    if (
      tLat == null ||
      Number.isNaN(tLat) ||
      tLng == null ||
      Number.isNaN(tLng)
    ) {
      try {
        const addrJson = tech.address;
        const addr =
          typeof addrJson === 'object' && addrJson !== null
            ? addrJson
            : addrJson
              ? JSON.parse(addrJson)
              : null;
        const addressObj = addr || {
          street: tech.address_street,
          number: tech.address_number,
          city: tech.address_city,
          state: tech.address_state,
          zipcode: tech.address_zipcode,
        };
        const coords = await GeocodingService.getCoordinates(addressObj || {});
        if (coords && coords.latitude && coords.longitude) {
          tLat = parseFloat(coords.latitude);
          tLng = parseFloat(coords.longitude);
          console.info(
            `[GEO] Persistindo coordenadas para technician_id=${tech.technician_id}, user_id=${tech.user_id}`,
            { latitude: tLat, longitude: tLng }
          );
          await pool.query(
            'UPDATE technicians SET latitude=$1, longitude=$2 WHERE user_id=$3',
            [tLat, tLng, tech.user_id]
          );
        }
      } catch (e) {
        // Silencia falhas de geocoding; técnico sem coordenadas será ignorado no filtro por raio
      }
    }

    if (
      tLat == null ||
      Number.isNaN(tLat) ||
      tLng == null ||
      Number.isNaN(tLng)
    ) {
      continue;
    }

    const distance = GeocodingService.calculateDistance(
      latNum,
      lngNum,
      tLat,
      tLng
    );

    const specialties = safeJson(tech.specialties);
    const services = safeJson(tech.services);

    technicians.push({
      id: tech.user_id,
      name: tech.name,
      address:
        `${tech.address_street || ''}, ${tech.address_number || ''} - ${tech.address_city || ''}, ${tech.address_state || ''}`.trim(),
      phone: tech.phone,
      email: tech.email,
      latitude: tLat,
      longitude: tLng,
      distance: parseFloat(distance.toFixed(2)),
      rating: Number(tech.rating) || 0,
      totalReviews: Number(tech.total_reviews) || 0,
      specialties,
      services,
      isRegistered: true,
      canRequestService: true,
      source: 'registered',
    });
  }

  const techniciansFiltered = technicians.filter(
    (tech) => tech.distance <= radiusKm
  );

  // 2. Buscar no Google Places API
  let externalPlaces = [];
  try {
    const placesResults = await PlacesService.searchNearby(
      latNum,
      lngNum,
      radiusKm * 1000 // Converter km para metros
    );

    externalPlaces = placesResults
      .map((place) => ({
        ...place,
        distance: parseFloat(
          GeocodingService.calculateDistance(
            latNum,
            lngNum,
            place.latitude,
            place.longitude
          ).toFixed(2)
        ),
        canRequestService: false,
        source: 'google_places',
      }))
      .filter((place) => place.distance <= radiusKm);
  } catch (error) {
    console.error('Error fetching Google Places:', error.message);
    // Continuar mesmo se Google Places falhar
  }

  // 3. Combinar e ordenar por distância
  const allServices = [...techniciansFiltered, ...externalPlaces].sort(
    (a, b) => a.distance - b.distance
  );

  // 4. Aplicar filtros de categoria se fornecido
  let filteredServices = allServices;
  if (categories) {
    const categoryList = categories
      .split(',')
      .map((c) => c.trim().toLowerCase());
    filteredServices = allServices.filter((service) => {
      if (service.specialties) {
        return service.specialties.some((spec) =>
          categoryList.some((cat) => spec.toLowerCase().includes(cat))
        );
      }
      if (service.types) {
        return service.types.some((type) =>
          categoryList.some((cat) => type.toLowerCase().includes(cat))
        );
      }
      return true;
    });
  }

  res.json({
    userLocation: { latitude: latNum, longitude: lngNum },
    radius: radiusKm,
    total: filteredServices.length,
    registered: techniciansFiltered.length,
    external: externalPlaces.length,
    services: filteredServices,
  });
});

function safeJson(str) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str || [];
  } catch {
    return [];
  }
}

/**
 * @desc    Buscar detalhes de um serviço externo (Google Places)
 * @route   GET /api/services/external/:placeId
 * @access  Public
 */
const getExternalServiceDetails = asyncHandler(async (req, res) => {
  const { placeId } = req.params;

  const details = await PlacesService.getPlaceDetails(placeId);

  if (!details) {
    res.status(404);
    throw new Error('Serviço não encontrado');
  }

  res.json(details);
});

module.exports = {
  getLocalServices,
  getExternalServiceDetails,
};
