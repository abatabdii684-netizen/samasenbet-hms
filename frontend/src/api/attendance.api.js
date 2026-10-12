import api from './axios';
const BASE = '/attendance';
export const attendanceAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getToday:  ()       => api.get(`${BASE}/today`),
  getSummary: (params) => api.get(`${BASE}/summary`, { params }),
  checkIn:   (data)   => api.post(`${BASE}/check-in`, data),
  checkOut:  (data)   => api.post(`${BASE}/check-out`, data),
  update:    (id, data) => api.put(`${BASE}/${id}`, data),
};
