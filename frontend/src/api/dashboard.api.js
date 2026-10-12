import api from './axios';
const BASE = '/dashboard';
export const dashboardAPI = {
  getOverview:     ()       => api.get(`${BASE}/overview`),
  getPatientChart: ()       => api.get(`${BASE}/charts/patients`),
  getRevenueChart: ()       => api.get(`${BASE}/charts/revenue`),
  getAlerts:       ()       => api.get(`${BASE}/alerts`),
  getRecentActivity: ()     => api.get(`${BASE}/recent-activity`),
};
