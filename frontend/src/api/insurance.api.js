import api from './axios';
const BASE = '/insurance';
export const insuranceAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getById:   (id)     => api.get(\/insurance/\),
  create:    (data)   => api.post(BASE, data),
  update:    (id, data) => api.put(\/insurance/\, data),
  patch:     (id, data) => api.patch(\/insurance/\, data),
  remove:    (id)     => api.delete(\/insurance/\),
};
