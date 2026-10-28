import axios from 'axios';

export const api = axios.create({
  baseURL: '', // URL do back
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor opcional para injetar token de autenticação futuramente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@WattVision:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});