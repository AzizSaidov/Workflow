import client from './client'

export const bidsApi = {
  create: (data) => client.post('/bids/', data),
  getForProject: (projectId) => client.get(`/bids/project/${projectId}`),
  getMyBids: () => client.get('/bids/my'),
  accept: (id) => client.put(`/bids/${id}/accept`),
  reject: (id) => client.put(`/bids/${id}/reject`),
}
