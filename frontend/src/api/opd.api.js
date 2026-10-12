import api from './axios';
const BASE = '/opd';
export const opdAPI = {
  getAll:     (params) => api.get(BASE, { params }),
  getById:    (id)     => api.get(`${BASE}/${id}`),
  create:     (data)   => api.post(BASE, data),
  diagnose:   (id, data) => api.patch(`${BASE}/${id}/diagnose`, data),
  discharge:  (id, data) => api.patch(`${BASE}/${id}/discharge`, data),
  getByClinic: (clinicType, params) => api.get(`${BASE}/clinic/${clinicType}`, { params }),
};
