import client from './client'

export const contractsApi = {
  getMine: () => client.get('/contracts/'),
  getByProject: (projectId) => client.get(`/contracts/project/${projectId}`),
  getOne: (id) => client.get(`/contracts/${id}`),
}
