import client from './client'

export const adminApi = {
  getReports: () => client.get('/admin/reports'),
  resolveReport: (id) => client.put(`/admin/reports/${id}/resolve`),
  getDisputes: () => client.get('/admin/disputes'),
  releaseDispute: (txId) => client.put(`/admin/disputes/${txId}/release`),
  refundDispute: (txId) => client.put(`/admin/disputes/${txId}/refund`),
  getUsers: () => client.get('/admin/users'),
  banUser: (id) => client.put(`/admin/users/${id}/ban`),
  unbanUser: (id) => client.put(`/admin/users/${id}/unban`),
  verifyUser: (id) => client.put(`/admin/users/${id}/verify`),
  getStats: () => client.get('/admin/stats'),
  topupWallet: (user_id, amount, reason) => client.post('/admin/wallet/topup', { user_id, amount, reason }),
}
