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
  getRevisions: (id) => client.get(`/projects/${id}/revisions`),
  getFiles: (id) => client.get(`/projects/${id}/files`),
  dispute: (id) => client.post(`/projects/${id}/dispute`),
  updateProgress: (id, percent) => client.patch(`/projects/${id}/progress`, { progress_percent: percent }),
  uploadFile: (projectId, file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post(`/media/project/${projectId}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}
