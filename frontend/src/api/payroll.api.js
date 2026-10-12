import api from './axios';
const BASE = '/payroll';
export const payrollAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  generate:  (data)   => api.post(`${BASE}/generate`, data),
  approve:   (id)     => api.patch(`${BASE}/${id}/approve`),
  pay:       (id, paymentRef) => api.patch(`${BASE}/${id}/pay`, { paymentRef }),
};
