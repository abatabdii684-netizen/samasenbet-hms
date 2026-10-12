import api from './axios';
const BASE = '/leaves';
export const leaveAPI = {
  getAll:     (params) => api.get(BASE, { params }),
  getById:    (id)     => api.get(`${BASE}/${id}`),
  getTypes:   ()       => api.get(`${BASE}/types`),
  create:     (data)   => api.post(BASE, data),
  approve:    (id)     => api.patch(`${BASE}/${id}/approve`),
  reject:     (id, note) => api.patch(`${BASE}/${id}/reject`, { rejectionNote: note }),
  cancel:     (id)     => api.delete(`${BASE}/${id}`),
};
