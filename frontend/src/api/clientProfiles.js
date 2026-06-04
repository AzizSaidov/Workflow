import client from './client'

export const clientProfilesApi = {
  get: (userId) => client.get(`/api/client-profiles/${userId}`),
  getProjects: (userId) => client.get(`/api/client-profiles/${userId}/projects`),
  updateMe: (data) => client.put('/api/client-profiles/me', data),
}
