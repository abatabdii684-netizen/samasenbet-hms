import api from './axios';
const BASE = '/laboratory';
export const laboratoryAPI = {
  // Orders
  getAll:       (params) => api.get(BASE, { params }),
  getById:      (id)     => api.get(`${BASE}/${id}`),
  create:       (data)   => api.post(BASE, data),
  enterResults: (id, results) => api.patch(`${BASE}/${id}/results`, { results }),
  approve:      (id)     => api.patch(`${BASE}/${id}/approve`),
  // Test catalog
  getAllTests:   (params) => api.get(`${BASE}/tests/all`, { params }),
  createTest:   (data)   => api.post(`${BASE}/tests`, data),
};
