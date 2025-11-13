import axios from '../../api/axios';

const getNearbyTechnicians = async (location, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(
    `/api/technicians/nearby?lat=${location.lat}&lng=${location.lng}`,
    config
  );

  return response.data;
};

// Obter técnico por ID
const getTechnician = async (technicianId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(`/api/technicians/${technicianId}`, config);

  return response.data;
};

// Novo: Obter top técnicos por região
const getTopTechniciansByRegion = async ({ city, state, limit = 5 }, token) => {
  const config = token ? {
    headers: {
      Authorization: `Bearer ${token}`
    }
  } : {};
  
  const params = new URLSearchParams();
  if (city) params.append('city', city);
  if (state) params.append('state', state);
  if (limit) params.append('limit', limit);
  
  const response = await axios.get(`/api/technicians/top?${params.toString()}`, config);
  return response.data;
};

// Novo: Enviar avaliação do técnico
const addTechnicianReview = async (technicianId, { ticketId, rating, comment }, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  const response = await axios.post(`/api/technicians/${technicianId}/reviews`, { ticketId, rating, comment }, config);
  return response.data;
};

const technicianService = {
  getNearbyTechnicians,
  getTechnician,
  getTopTechniciansByRegion,
  addTechnicianReview
};

export default technicianService;