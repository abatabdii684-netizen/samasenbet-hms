import api from './axios';
const BASE = '/inventory';
export const inventoryAPI = {
  getAll:       (params) => api.get(BASE, { params }),
  getById:      (id)     => api.get(`${BASE}/${id}`),
  getCategories: ()      => api.get(`${BASE}/categories`),
  getLowStock:  ()       => api.get(`${BASE}/low-stock`),
  create:       (data)   => api.post(BASE, data),
  update:       (id, data) => api.put(`${BASE}/${id}`, data),
  remove:       (id)     => api.delete(`${BASE}/${id}`),
  stockIn:      (id, data) => api.post(`${BASE}/${id}/stock-in`, data),
  stockOut:     (id, data) => api.post(`${BASE}/${id}/stock-out`, data),
};
