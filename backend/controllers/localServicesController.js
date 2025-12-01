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
    const { latitude, longitude, radius = 10, categories } = req.query;

    if (!latitude || !longitude) {
        res.status(400);
        throw new Error('Latitude e longitude são obrigatórias');
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    console.log(`Searching for services near (${lat}, ${lng}) within ${radiusKm}km`);

    // 1. Buscar técnicos cadastrados no sistema
    const pool = getPool();
    const techniciansQuery = await pool.query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      t.business_phone,
      t.business_description,
      t.specialties,
      t.services,
      t.latitude,
      t.longitude,
      t.address_street,
      t.address_number,
      t.address_city,
      t.address_state,
      t.address_zipcode,
      t.business_hours
    FROM users u
    JOIN technicians t ON u.id = t.user_id
    WHERE u.role = 'technician'
      AND t.latitude IS NOT NULL
      AND t.longitude IS NOT NULL
  `);

    const technicians = techniciansQuery.rows
        .map(tech => {
            const distance = GeocodingService.calculateDistance(
                lat, lng,
                parseFloat(tech.latitude), parseFloat(tech.longitude)
            );

            // Parse specialties and services
            let specialties = [];
            let services = [];

            try {
                specialties = typeof tech.specialties === 'string'
                    ? JSON.parse(tech.specialties)
                    : tech.specialties || [];
            } catch (e) {
                specialties = [];
            }

            try {
                services = typeof tech.services === 'string'
                    ? JSON.parse(tech.services)
                    : tech.services || [];
            } catch (e) {
                services = [];
            }

            return {
                id: tech.id,
                name: tech.business_name || tech.name,
                address: `${tech.address_street || ''}, ${tech.address_number || ''} - ${tech.address_city || ''}, ${tech.address_state || ''}`.trim(),
                phone: tech.business_phone,
                description: tech.business_description,
                latitude: parseFloat(tech.latitude),
                longitude: parseFloat(tech.longitude),
                distance: parseFloat(distance.toFixed(2)),
                rating: 5.0, // Placeholder até implementar sistema de avaliações
                specialties: specialties,
                services: services,
                businessHours: tech.business_hours,
                isRegistered: true, // Marca como cadastrado no sistema
                canRequestService: true,
                source: 'registered'
            };
        })
        .filter(tech => tech.distance <= radiusKm);

    // 2. Buscar no Google Places API
    let externalPlaces = [];
    try {
        const placesResults = await PlacesService.searchNearby(
            lat,
            lng,
            radiusKm * 1000 // Converter km para metros
        );

        externalPlaces = placesResults
            .map(place => ({
                ...place,
                distance: parseFloat(
                    GeocodingService.calculateDistance(
                        lat, lng,
                        place.latitude, place.longitude
                    ).toFixed(2)
                ),
                canRequestService: false,
                source: 'google_places'
            }))
            .filter(place => place.distance <= radiusKm);
    } catch (error) {
        console.error('Error fetching Google Places:', error.message);
        // Continuar mesmo se Google Places falhar
    }

    // 3. Combinar e ordenar por distância
    const allServices = [...technicians, ...externalPlaces]
        .sort((a, b) => a.distance - b.distance);

    // 4. Aplicar filtros de categoria se fornecido
    let filteredServices = allServices;
    if (categories) {
        const categoryList = categories.split(',').map(c => c.trim().toLowerCase());
        filteredServices = allServices.filter(service => {
            if (service.specialties) {
                return service.specialties.some(spec =>
                    categoryList.some(cat => spec.toLowerCase().includes(cat))
                );
            }
            if (service.types) {
                return service.types.some(type =>
                    categoryList.some(cat => type.toLowerCase().includes(cat))
                );
            }
            return true;
        });
    }

    res.json({
        userLocation: { latitude: lat, longitude: lng },
        radius: radiusKm,
        total: filteredServices.length,
        registered: technicians.length,
        external: externalPlaces.length,
        services: filteredServices
    });
});

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
    getExternalServiceDetails
};
