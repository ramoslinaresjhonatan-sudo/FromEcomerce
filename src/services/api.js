import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const normalizeApiUrl = (url) => {
  const trimmedUrl = url.replace(/\/+$/, '');

  if (trimmedUrl.endsWith('/api/v1')) {
    return trimmedUrl;
  }

  if (trimmedUrl.endsWith('/api')) {
    return `${trimmedUrl}/v1`;
  }

  return `${trimmedUrl}/api/v1`;
};

const API_URL = normalizeApiUrl(rawApiUrl);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptor: agrega el token a cada petición ──────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interceptor: refresca token si expira (401) ───────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh,
          });
          localStorage.setItem('access_token', data.access);
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          // Refresh falló → forzar logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth helpers ──────────────────────────────────────
export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/', { email, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const user = data.user ?? (await api.get('/usuarios/me/')).data;
    localStorage.setItem('user', JSON.stringify(user));
    return { ...data, user };
  },

  async register(userData) {
    const { data } = await api.post('/usuarios/register/', userData);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  async fetchMe() {
    const { data } = await api.get('/usuarios/me/');
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },
};

export default api;
