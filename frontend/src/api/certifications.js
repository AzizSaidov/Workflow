import client from './client'

export const certificationsApi = {
  getByProfile: (profileId) => client.get(`/certifications/profile/${profileId}`),
  create: (data) => client.post('/certifications/', data),
  update: (id, data) => client.put(`/certifications/${id}`, data),
  delete: (id) => client.delete(`/certifications/${id}`),
}
