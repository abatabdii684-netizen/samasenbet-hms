import api from './axios';
const BASE = '/deliveries';
export const deliveryAPI = {
  getAll:  (params) => api.get(BASE, { params }),
  getById: (id)     => api.get(`${BASE}/${id}`),
  create:  (data)   => api.post(BASE, data),
  update:  (id, data) => api.put(`${BASE}/${id}`, data),
};
