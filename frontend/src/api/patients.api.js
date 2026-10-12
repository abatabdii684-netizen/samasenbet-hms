import api from './axios';
const BASE = '/patients';
export const patientsAPI = {
  getAll:          (params) => api.get(BASE, { params }),
  getById:         (id)     => api.get(`${BASE}/${id}`),
  getHistory:      (id)     => api.get(`${BASE}/${id}/history`),
  getVisits:       (id, params) => api.get(`${BASE}/${id}/visits`, { params }),
  getPrescriptions:(id)     => api.get(`${BASE}/${id}/prescriptions`),
  getLabResults:   (id)     => api.get(`${BASE}/${id}/lab-results`),
  getBilling:      (id)     => api.get(`${BASE}/${id}/billing`),
  create:          (data)   => api.post(BASE, data),
  update:          (id, data) => api.put(`${BASE}/${id}`, data),
  remove:          (id)     => api.delete(`${BASE}/${id}`),
};
