import api from './axios';
const BASE = '/billing';
export const billingAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  create:    (data)   => api.post(BASE, data),
  addItem:   (id, data)       => api.post(`${BASE}/${id}/items`, data),
  removeItem: (id, itemId)    => api.delete(`${BASE}/${id}/items/${itemId}`),
  finalize:  (id)     => api.patch(`${BASE}/${id}/finalize`),
};
