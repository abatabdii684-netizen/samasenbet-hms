import api from './axios';
const BASE = '/employees';
export const employeesAPI = {
  getAll:        (params)   => api.get(BASE, { params }),
  getById:       (id)       => api.get(`${BASE}/${id}`),
  create:        (data)     => api.post(BASE, data),
  update:        (id, data) => api.put(`${BASE}/${id}`, data),
  toggleStatus:  (id)       => api.patch(`${BASE}/${id}/toggle-status`),
  getAttendance: (id, params) => api.get(`${BASE}/${id}/attendance`, { params }),
  getLeaves:     (id)       => api.get(`${BASE}/${id}/leaves`),
  getPayslips:   (id)       => api.get(`${BASE}/${id}/payslips`),
  getByDept:     (dept)     => api.get(`${BASE}/department/${dept}`),
};
