import axios from '../../api/axios';

// Obter anúncios ativos para o usuário atual (usa token)
const getActiveAds = async (token) => {
  const res = await axios.get('/api/ads', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Obter anúncios públicos (sem token)
const getPublicAds = async () => {
  const res = await axios.get('/api/ads/public');
  return res.data;
};

// Criar anúncio (técnico autenticado)
const createAd = async ({ token, payload }) => {
  const res = await axios.post('/api/ads', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Listar anúncios do técnico autenticado
const getMyAds = async (token) => {
  const res = await axios.get('/api/ads/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Atualizar anúncio do técnico
const updateAd = async ({ token, id, payload }) => {
  const res = await axios.put(`/api/ads/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Upload de mídia (retorna filePath)
const uploadMedia = async ({ token, file }) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post('/api/uploads', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data; // { message, filePath }
};

// Comprar remoção de anúncios (cliente)
const purchaseAdRemoval = async ({ months = 1, token }) => {
  const res = await axios.post('/api/ads/purchase-remove', { months }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { message, adFreeUntil, amountCharged, currency }
};

const adsService = {
  getActiveAds,
  getPublicAds,
  createAd,
  getMyAds,
  updateAd,
  uploadMedia,
  purchaseAdRemoval,
};

export default adsService;