const axios = require('axios');
const NodeCache = require('node-cache');

// Cache de 1 hora para resultados do Google Places
const cache = new NodeCache({ stdTTL: 3600 });

/**
 * Serviço para buscar lugares (assistências técnicas) usando Google Places API
 */
class PlacesService {
    /**
     * Busca lugares próximos a uma localização
     * @param {number} latitude - Latitude do centro da busca
     * @param {number} longitude - Longitude do centro da busca
     * @param {number} radius - Raio de busca em metros (padrão: 10km)
     * @param {string} keyword - Palavra-chave para busca
     * @returns {Array} Array de lugares encontrados
     */
    static async searchNearby(latitude, longitude, radius = 10000, keyword = 'assistência técnica computador celular') {
        const cacheKey = `places_${latitude}_${longitude}_${radius}_${keyword}`;

        // Verificar cache
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log('Returning cached Places API results');
            return cached;
        }

        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
                params: {
                    location: `${latitude},${longitude}`,
                    radius: radius,
                    keyword: keyword,
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            });

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                console.error('Places API error:', response.data.status, response.data.error_message);
                return [];
            }

            const places = response.data.results.map(place => ({
                id: place.place_id,
                name: place.name,
                address: place.vicinity,
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                rating: place.rating || 0,
                userRatingsTotal: place.user_ratings_total || 0,
                types: place.types,
                isExternal: true, // Marca como externo (não cadastrado no sistema)
                photoReference: place.photos?.[0]?.photo_reference,
                openNow: place.opening_hours?.open_now,
                priceLevel: place.price_level
            }));

            // Cachear resultados
            cache.set(cacheKey, places);
            console.log(`Found ${places.length} places from Google Maps`);

            return places;
        } catch (error) {
            console.error('Places API request failed:', error.message);
            return [];
        }
    }

    /**
     * Busca detalhes de um lugar específico
     * @param {string} placeId - ID do lugar no Google Places
     * @returns {Object|null} Detalhes do lugar
     */
    static async getPlaceDetails(placeId) {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
                params: {
                    place_id: placeId,
                    fields: 'name,formatted_address,formatted_phone_number,opening_hours,website,rating,reviews,photos',
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            });

            if (response.data.status === 'OK') {
                return response.data.result;
            }

            return null;
        } catch (error) {
            console.error('Place details request failed:', error.message);
            return null;
        }
    }

    /**
     * Obtém URL de uma foto do Google Places
     * @param {string} photoReference - Referência da foto
     * @param {number} maxWidth - Largura máxima da foto
     * @returns {string} URL da foto
     */
    static getPhotoUrl(photoReference, maxWidth = 400) {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    }

    /**
     * Limpa o cache de resultados
     */
    static clearCache() {
        cache.flushAll();
        console.log('Places cache cleared');
    }
}

module.exports = PlacesService;
