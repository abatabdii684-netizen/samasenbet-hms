import api from './axios';
const BASE = '/roles';
export const rolesAPI = {
  getAll:           (params) => api.get(BASE, { params }),
  getById:          (id)     => api.get(`${BASE}/${id}`),
  getAllPermissions: ()       => api.get(`${BASE}/permissions/all`),
  create:           (data)   => api.post(BASE, data),
  update:           (id, data) => api.put(`${BASE}/${id}`, data),
  remove:           (id)     => api.delete(`${BASE}/${id}`),
  assignPermissions: (id, permissionIds) => api.post(`${BASE}/${id}/assign-permissions`, { permissionIds }),
};
