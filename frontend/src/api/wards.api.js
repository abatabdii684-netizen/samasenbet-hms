import api from './axios';
const BASE = '/wards';
export const wardsAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  create:    (data)   => api.post(BASE, data),
  update:    (id, data) => api.put(`${BASE}/${id}`, data),
  remove:    (id)     => api.delete(`${BASE}/${id}`),
  getBeds:   (id)     => api.get(`${BASE}/${id}/beds`),
  getPatients: (id)   => api.get(`${BASE}/${id}/patients`),
};
