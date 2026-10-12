import api from './axios';
const BASE = '/users';
export const usersAPI = {
  getAll:        (params) => api.get(BASE, { params }),
  getById:       (id)     => api.get(`${BASE}/${id}`),
  create:        (data)   => api.post(BASE, data),
  update:        (id, data) => api.put(`${BASE}/${id}`, data),
  toggleStatus:  (id)     => api.patch(`${BASE}/${id}/toggle-status`),
  remove:        (id)     => api.delete(`${BASE}/${id}`),
};
