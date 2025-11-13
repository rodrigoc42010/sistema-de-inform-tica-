import axios from '../../api/axios';

// Criar novo ticket
const createTicket = async (ticketData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post('/api/tickets/', ticketData, config);

  return response.data;
};

// Obter tickets do usuário
const getTickets = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get('/api/tickets/', config);

  return response.data;
};

// Obter ticket único
const getTicket = async (ticketId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(`/api/tickets/${ticketId}`, config);

  return response.data;
};

// Fechar ticket
const closeTicket = async (ticketId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(
    `/api/tickets/${ticketId}`,
    { status: 'closed' },
    config
  );

  return response.data;
};

const ticketService = {
  createTicket,
  getTickets,
  getTicket,
  closeTicket
};

export default ticketService;