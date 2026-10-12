import api from './axios';
const BASE = '/triage';
export const triageAPI = {
  getAll:  (params) => api.get(BASE, { params }),
  getById: (id)     => api.get(`${BASE}/${id}`),
  create:  (data)   => api.post(BASE, data),
  update:  (id, data) => api.put(`${BASE}/${id}`, data),
};
