import client from './client'

export const notificationsApi = {
  getAll: () => client.get('/notifications/'),
  getUnreadCount: () => client.get('/notifications/unread-count'),
  markRead: (id) => client.put(`/notifications/${id}/read`),
  markAllRead: () => client.put('/notifications/read-all'),
  delete: (id) => client.delete(`/notifications/${id}`),
}

export function createNotifWS(userId, token) {
  return new WebSocket(`ws://localhost:8000/api/notifications/ws/notifications/${userId}?token=${token}`)
}
