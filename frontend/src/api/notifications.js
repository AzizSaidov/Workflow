import client from './client'

export const notificationsApi = {
  getAll: () => client.get('/notifications/'),
  getUnreadCount: () => client.get('/notifications/unread-count'),
  markRead: (id) => client.put(`/notifications/${id}/read`),
  markAllRead: () => client.put('/notifications/read-all'),
  delete: (id) => client.delete(`/notifications/${id}`),
}

export function createNotifWS(userId, token) {
  const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    .replace(/^https/, 'wss').replace(/^http/, 'ws')
  return new WebSocket(`${wsBase}/ws/notifications/${userId}?token=${token}`)
}
