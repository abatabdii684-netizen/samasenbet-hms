import api from './axios';
const BASE = '/audit-logs';
export const auditLogsAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getById:   (id)     => api.get(\/audit-logs/\),
  create:    (data)   => api.post(BASE, data),
  update:    (id, data) => api.put(\/audit-logs/\, data),
  patch:     (id, data) => api.patch(\/audit-logs/\, data),
  remove:    (id)     => api.delete(\/audit-logs/\),
};
