import client from './client'

export const projectsApi = {
  getAll: (params) => client.get('/projects/', { params }),
  getMine: () => client.get('/projects/my'),
  getOne: (id) => client.get(`/projects/${id}`),
  create: (data) => client.post('/projects/', data),
  update: (id, data) => client.put(`/projects/${id}`, data),
  delete: (id) => client.delete(`/projects/${id}`),
  deliver: (id, data) => client.put(`/projects/${id}/deliver`, data),
  acceptDelivery: (id) => client.put(`/projects/${id}/accept-delivery`),
  requestRevision: (id, data) => client.put(`/projects/${id}/revision`, data),
}
