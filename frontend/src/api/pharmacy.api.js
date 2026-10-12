import api from './axios';
const BASE = '/pharmacy';
export const pharmacyAPI = {
  // Prescriptions
  getAll:     (params) => api.get(BASE, { params }),
  getById:    (id)     => api.get(`${BASE}/${id}`),
  dispense:   (id)     => api.patch(`${BASE}/${id}/dispense`),
  // Drug catalog
  getAllDrugs: (params) => api.get(`${BASE}/drugs/all`, { params }),
  createDrug:  (data)  => api.post(`${BASE}/drugs`, data),
  updateDrug:  (id, data) => api.put(`${BASE}/drugs/${id}`, data),
  addStock:    (data)  => api.post(`${BASE}/drugs/stock`, data),
  getLowStock: ()      => api.get(`${BASE}/drugs/low-stock`),
  getExpiring: (days)  => api.get(`${BASE}/drugs/expiring`, { params: { days } }),
};
