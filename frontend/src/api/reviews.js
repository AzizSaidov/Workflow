import client from './client'

export const reviewsApi = {
  getByUser: (userId) => client.get(`/reviews/user/${userId}`),
  create: (data) => client.post('/reviews/', data),
}
