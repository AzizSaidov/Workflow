import client from './client'

export const reportsApi = {
  create: (data) => client.post('/api/reports/', data),
}
