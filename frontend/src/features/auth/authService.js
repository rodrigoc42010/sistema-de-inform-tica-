import api from '../../api/axios';

// Registrar usuário
const register = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  if (response.data) {
    // We still store user info in localStorage for UI convenience (non-sensitive)
    // but tokens are in httpOnly cookies.
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Login de usuário
const login = async (userData) => {
  const response = await api.post('/api/auth/login', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Logout de usuário
const logout = async () => {
  try {
    await api.post('/api/auth/logout', {});
  } catch (e) {
    // Ignore logout errors
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Cleanup legacy
    localStorage.removeItem('refreshToken'); // Cleanup legacy
  }
};

// Recuperação de senha
const forgotPassword = async (email) => {
  const response = await api.post('/api/auth/forgot-password', { email });
  return response.data;
};

// Atualizar perfil
const updateProfile = async (userData) => {
  const response = await api.put('/api/users/profile', userData);
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
