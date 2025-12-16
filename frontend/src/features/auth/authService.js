import axios from '../../api/axios';

// Registrar usuário
const register = async (userData) => {
  try {
    const response = await axios.post('/api/users', userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
    return response.data;
  } catch (err) {
    const message =
      (err.response && err.response.data && err.response.data.message) ||
      err.message ||
      'Falha ao registrar';
    throw new Error(message);
  }
};

// Login de usuário
const login = async (userData) => {
  // Se for login de técnico, usar endpoint específico
  let endpoint = 'login';
  if (userData?.role === 'technician') {
    // Frontend passa loginId no campo email para reaproveitar UI atual?
    // Ajustado: aceitar userData.loginId quando presente
    endpoint = 'technician-login';
  }
  const payload = { ...userData };
  if (endpoint === 'technician-login') {
    // Passar cpfCnpj para backend quando login de técnico
    // Mantém compatibilidade: se vier loginId/email, ainda funciona
    if (userData.cpfCnpj) {
      payload.cpfCnpj = userData.cpfCnpj;
      delete payload.email;
      delete payload.loginId;
    } else if (userData.loginId || userData.email) {
      payload.loginId = userData.loginId || userData.email;
      delete payload.email;
    }
  }

  const response = await axios.post(`/api/users/${endpoint}`, payload);

  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
    // Persistir token também em chave separada para consistência em fluxos diversos
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
  }

  return response.data;
};

// Logout de usuário
const logout = async () => {
  try {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    const token = user?.token || localStorage.getItem('token');
    if (token) {
      await axios.post('/api/users/logout', {});
    }
  } catch (e) {
    // Ignorar erros (errors) de logout
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
};

// Recuperação de senha
const forgotPassword = async (email) => {
  const response = await axios.post('/api/users/forgot-password', { email });
  return response.data;
};

// Atualizar perfil
const updateProfile = async (userData) => {
  const response = await axios.put('/api/users/profile', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  forgotPassword,
  updateProfile,
};

export default authService;
