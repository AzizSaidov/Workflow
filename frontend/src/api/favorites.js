import client from './client'

export const favoritesApi = {
  getAll: () => client.get('/favorites/'),
  addFreelancer: (id) => client.post(`/favorites/freelancer/${id}`),
  removeFreelancer: (id) => client.delete(`/favorites/freelancer/${id}`),
  addProject: (id) => client.post(`/favorites/project/${id}`),
  removeProject: (id) => client.delete(`/favorites/project/${id}`),
}
