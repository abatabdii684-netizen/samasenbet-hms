import api from './axios';
const BASE = '/operation-rooms';
export const operationRoomAPI = {
  getAll:      (params) => api.get(BASE, { params }),
  getToday:    ()       => api.get(`${BASE}/schedule/today`),
  getRooms:    ()       => api.get(`${BASE}/rooms`),
  getById:     (id)     => api.get(`${BASE}/${id}`),
  create:      (data)   => api.post(BASE, data),
  updateStatus:(id, status, data) => api.patch(`${BASE}/${id}/status`, { status, ...data }),
};
