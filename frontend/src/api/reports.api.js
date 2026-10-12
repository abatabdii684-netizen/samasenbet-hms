import api from './axios';
const BASE = '/reports';
export const reportsAPI = {
  getDaily:      (date)                       => api.get(`${BASE}/daily`, { params: { date } }),
  getMonthly:    (month, year)                => api.get(`${BASE}/monthly`, { params: { month, year } }),
  getRevenue:    (startDate, endDate)         => api.get(`${BASE}/revenue`, { params: { startDate, endDate } }),
  getPatients:   (startDate, endDate)         => api.get(`${BASE}/patients`, { params: { startDate, endDate } }),
  getLaboratory: (startDate, endDate)         => api.get(`${BASE}/laboratory`, { params: { startDate, endDate } }),
  exportPDF:     (type, params)               => api.get(`${BASE}/export/pdf/${type}`, { params, responseType: 'blob' }),
  exportExcel:   (type, params)               => api.get(`${BASE}/export/excel/${type}`, { params, responseType: 'blob' }),
};
