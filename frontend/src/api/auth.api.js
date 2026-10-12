import api from './axios';

export const authAPI = {
  login:           (credentials)    => api.post('/auth/login', credentials),
  logout:          ()               => api.post('/auth/logout'),
  refreshToken:    ()               => api.post('/auth/refresh-token'),
  getMe:           ()               => api.get('/auth/me'),
  forgotPassword:  (data)           => api.post('/auth/forgot-password', data),
  resetPassword:   (data)           => api.post('/auth/reset-password', data),
  changePassword:  (data)           => api.patch('/auth/change-password', data),
};
