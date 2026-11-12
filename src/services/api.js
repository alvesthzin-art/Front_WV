import axios from 'axios';
import { getToken } from './session';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // <-- Adicionado /api aqui
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
