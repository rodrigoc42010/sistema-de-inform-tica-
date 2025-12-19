import axios from 'axios';

const resolvedBase = process.env.REACT_APP_API_BASE_URL || '';

const instance = axios.create({
  baseURL: resolvedBase,
  timeout: 15000,
  withCredentials: true, // CRITICAL: Send cookies with every request
});

// Interceptor for responses
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error?.response?.status === 401 && !originalRequest._retry) {
      // If it's already a login/register request, don't retry
      if (
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to refresh the token via the /refresh endpoint
        // The backend will read the refreshToken cookie and set a new accessToken cookie
        await axios.post(
          `${resolvedBase}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Retry the original request
        return instance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login')
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
