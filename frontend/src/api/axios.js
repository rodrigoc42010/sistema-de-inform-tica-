import axios from 'axios';

const runtimeBase =
  (typeof window !== 'undefined' &&
    (window.__API_BASE_URL__ || localStorage.getItem('API_BASE_URL'))) ||
  '';
const resolvedBase =
  process.env.REACT_APP_API_BASE_URL ||
  runtimeBase ||
  (typeof window !== 'undefined' ? window.location.origin : '');

const instance = axios.create({
  baseURL: resolvedBase,
  timeout: 15000,
});

// Attach Authorization automatically when available
instance.interceptors.request.use((config) => {
  try {
    const token =
      (typeof window !== 'undefined' && localStorage.getItem('token')) || '';
    if (
      token &&
      !(
        config.headers &&
        (config.headers.Authorization || config.headers.authorization)
      )
    ) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  } catch {}
  return config;
});

// Handle 401 globally: clear stale token and let caller react
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se erro 401 e não for uma tentativa de refresh já falha
    if (
      error?.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      // Evitar loop infinito em rotas de login/register
      if (
        originalRequest.url.includes('/login') ||
        originalRequest.url.includes('/register')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Tentar renovar o token
          // Usamos axios puro para evitar loop no interceptor
          const { data } = await axios.post(
            `${resolvedBase}/api/users/refresh`,
            { refreshToken }
          );

          if (data.token) {
            localStorage.setItem('token', data.token);

            // Atualizar headers da requisição original e do padrão
            instance.defaults.headers.common['Authorization'] =
              `Bearer ${data.token}`;
            originalRequest.headers['Authorization'] = `Bearer ${data.token}`;

            // Retentar a requisição original
            return instance(originalRequest);
          }
        }
      } catch (refreshError) {
        // Se falhar o refresh, limpar tudo e redirecionar
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirecionar para login apenas se não estiver lá
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
