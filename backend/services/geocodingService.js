const axios = require('axios');

/**
 * Serviço de Geocoding para converter endereços em coordenadas
 * e calcular distâncias entre pontos
 */
class GeocodingService {
    /**
     * Converte um endereço em coordenadas (latitude/longitude)
     * @param {Object} address - Objeto com dados do endereço
     * @returns {Object|null} Coordenadas {latitude, longitude} ou null se não encontrado
     */
    static async getCoordinates(address) {
        try {
            const street = address.street || '';
            const number = address.number || '';
            const city = address.city || '';
            const state = address.state || '';
            const zip = address.zipcode || address.zipCode || address.cep || '';

            const fullAddress = `${street}, ${number}, ${city}, ${state}, ${zip}, Brazil`.replace(/, ,/g, ',');

            const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: fullAddress,
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            });

            if (response.data.results && response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: response.data.results[0].formatted_address
                };
            }

            console.log('Google Maps Response:', JSON.stringify(response.data));
            console.warn(`Geocoding failed for address: ${fullAddress}`);
            return null;
        } catch (error) {
            console.error('Geocoding error:', error.message);
            return null;
        }
    }

    /**
     * Calcula a distância entre dois pontos usando a fórmula de Haversine
     * @param {number} lat1 - Latitude do ponto 1
     * @param {number} lon1 - Longitude do ponto 1
     * @param {number} lat2 - Latitude do ponto 2
     * @param {number} lon2 - Longitude do ponto 2
     * @returns {number} Distância em quilômetros
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    /**
     * Converte graus para radianos
     * @param {number} degrees - Valor em graus
     * @returns {number} Valor em radianos
     */
    static toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Geocodifica múltiplos endereços em lote
     * @param {Array} addresses - Array de objetos de endereço
     * @returns {Array} Array de coordenadas
     */
    static async batchGeocode(addresses) {
        const promises = addresses.map(addr => this.getCoordinates(addr));
        return await Promise.all(promises);
    }
}

module.exports = GeocodingService;
