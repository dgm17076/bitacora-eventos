import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export const eventsApi = {
  getAll: (params) => api.get('/events', { params }),
  getOne: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  resolve: (id) => api.patch(`/events/${id}/resolve`),
  delete: (id) => api.delete(`/events/${id}`)
};

export const statsApi = {
  get: () => api.get('/stats')
};

export default api;
