import client from './client'

export const portfolioApi = {
  getByUser: (userId) => client.get(`/portfolio/${userId}`),
  create: (data) => client.post('/portfolio/', data),
  update: (id, data) => client.put(`/portfolio/${id}`, data),
  delete: (id) => client.delete(`/portfolio/${id}`),
  like: (id) => client.post(`/portfolio/${id}/like`),
  unlike: (id) => client.delete(`/portfolio/${id}/like`),
}
