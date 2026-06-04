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
  changeRole: (id, new_role) => client.put(`/admin/users/${id}/role`, { new_role }),
  grantAdmin: (id) => client.put(`/admin/users/${id}/grant-admin`),
  revokeAdmin: (id) => client.put(`/admin/users/${id}/revoke-admin`),
  getStats: () => client.get('/admin/stats'),
  topupWallet: (user_id, amount, reason) => client.post('/admin/wallet/topup', { user_id, amount, reason }),
}
