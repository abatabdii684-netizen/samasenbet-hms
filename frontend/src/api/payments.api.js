import api from './axios';
const BASE = '/payments';
export const paymentsAPI = {
  getAll:  (params) => api.get(BASE, { params }),
  getById: (id)     => api.get(`${BASE}/${id}`),
  create:  (data)   => api.post(BASE, data),
  refund:  (id, reason) => api.patch(`${BASE}/${id}/refund`, { reason }),
};
