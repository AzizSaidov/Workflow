import client from './client'

export const bidsApi = {
  create: (projectId, data) => client.post(`/bids/project/${projectId}`, data),
  getForProject: (projectId) => client.get(`/bids/project/${projectId}`),
  getMyBids: () => client.get('/bids/my'),
  accept: (id) => client.put(`/bids/${id}/accept`),
  reject: (id) => client.put(`/bids/${id}/reject`),
}
