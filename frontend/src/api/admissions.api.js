import api from './axios';
const BASE = '/admissions';
export const admissionsAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getActive: ()       => api.get(`${BASE}/active`),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  create:    (data)   => api.post(BASE, data),
  discharge: (id, data) => api.patch(`${BASE}/${id}/discharge`, data),
  transfer:  (id, data) => api.patch(`${BASE}/${id}/transfer`, data),
};
