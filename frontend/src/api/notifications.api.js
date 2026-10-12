import api from './axios';
const BASE = '/notifications';
export const notificationsAPI = {
  getAll:    (params) => api.get(BASE, { params }),
  getById:   (id)     => api.get(\/notifications/\),
  create:    (data)   => api.post(BASE, data),
  update:    (id, data) => api.put(\/notifications/\, data),
  patch:     (id, data) => api.patch(\/notifications/\, data),
  remove:    (id)     => api.delete(\/notifications/\),
};
