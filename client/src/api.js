import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Перехватчик для добавления JWT-токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const path = window.location.pathname;
      if (!path.startsWith('/login') && path !== '/') {
        window.location.replace(`/login?redirect=${encodeURIComponent(path)}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;