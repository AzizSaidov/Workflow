import client from './client'

export const clientProfilesApi = {
  get: (userId) => client.get(`/client-profiles/${userId}`),
  getProjects: (userId) => client.get(`/client-profiles/${userId}/projects`),
  updateMe: (data) => client.put('/client-profiles/me', data),
}
