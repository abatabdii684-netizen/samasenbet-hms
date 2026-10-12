import api from './axios';
const BASE = '/queues';
export const queueAPI = {
  getAll:       (params)     => api.get(BASE, { params }),
  getActive:    ()           => api.get(`${BASE}/active`),
  getStats:     (clinicType) => api.get(`${BASE}/stats`, { params: { clinicType } }),
  create:       (data)       => api.post(BASE, data),
  callNext:     (clinicType) => api.patch(`${BASE}/call-next`, { clinicType }),
  updateStatus: (id, status) => api.patch(`${BASE}/${id}/status`, { status }),
};
