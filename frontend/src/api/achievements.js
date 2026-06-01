import client from './client'

export const achievementsApi = {
  getAll: () => client.get('/achievements/'),
  getMine: () => client.get('/achievements/me'),
  getForUser: (userId) => client.get(`/achievements/${userId}`),
}
