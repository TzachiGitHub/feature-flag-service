import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
export { api as apiClient };

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => api.post('/auth/register', { name, email, password }),
};

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (key: string) => api.get(`/projects/${key}`),
  create: (data: any) => api.post('/projects', data),
};

export const environmentsApi = {
  list: (projectKey: string) => api.get(`/projects/${projectKey}/environments`),
};

export const flagsApi = {
  list: (projectKey: string, params?: any) => api.get(`/projects/${projectKey}/flags`, { params }),
  get: (projectKey: string, flagKey: string) => api.get(`/projects/${projectKey}/flags/${flagKey}`),
  create: (projectKey: string, data: any) => api.post(`/projects/${projectKey}/flags`, data),
  update: (projectKey: string, flagKey: string, data: any) => api.put(`/projects/${projectKey}/flags/${flagKey}`, data),
  delete: (projectKey: string, flagKey: string) => api.delete(`/projects/${projectKey}/flags/${flagKey}`),
  toggle: (projectKey: string, flagKey: string, envKey: string) => api.post(`/projects/${projectKey}/flags/${flagKey}/environments/${envKey}/toggle`),
  getTargeting: (projectKey: string, flagKey: string, envKey: string) => api.get(`/projects/${projectKey}/flags/${flagKey}/environments/${envKey}`),
  updateTargeting: (projectKey: string, flagKey: string, envKey: string, data: any) => api.patch(`/projects/${projectKey}/flags/${flagKey}/environments/${envKey}`, data),
};
