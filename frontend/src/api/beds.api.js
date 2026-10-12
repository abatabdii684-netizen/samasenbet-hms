import api from './axios';
const BASE = '/beds';
export const bedsAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getById:   (id)     => api.get(\/beds/\),
  create:    (data)   => api.post(BASE, data),
  update:    (id, data) => api.put(\/beds/\, data),
  patch:     (id, data) => api.patch(\/beds/\, data),
  remove:    (id)     => api.delete(\/beds/\),
};
