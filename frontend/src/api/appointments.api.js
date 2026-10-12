import api from './axios';
const BASE = '/appointments';
export const appointmentsAPI = {
  getAll:       (params) => api.get(BASE, { params }),
  getToday:     ()       => api.get(`${BASE}/today`),
  getById:      (id)     => api.get(`${BASE}/${id}`),
  getByDoctor:  (doctorId) => api.get(`${BASE}/doctor/${doctorId}`),
  create:       (data)   => api.post(BASE, data),
  update:       (id, data) => api.put(`${BASE}/${id}`, data),
  updateStatus: (id, status) => api.patch(`${BASE}/${id}/status`, { status }),
  remove:       (id)     => api.delete(`${BASE}/${id}`),
};
