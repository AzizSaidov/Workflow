import client from './client'

export const chatsApi = {
  getHistory: (projectId) => client.get(`/chats/${projectId}`),
  deleteChat: (projectId) => client.delete(`/chats/${projectId}`),
  getHidden: () => client.get('/chats/hidden'),
  hideChat: (projectId) => client.post(`/chats/${projectId}/hide`),
  editMessage: (projectId, messageId, content) => client.put(`/chats/${projectId}/messages/${messageId}`, { content }),
  deleteMessage: (projectId, messageId) => client.delete(`/chats/${projectId}/messages/${messageId}`),
  uploadFile: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/media/upload', form, { headers: { 'Content-Type': undefined } })
  },
}

export function createChatWS(projectId, token) {
  const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    .replace(/^https/, 'wss').replace(/^http/, 'ws')
  return new WebSocket(`${wsBase}/ws/chat/${projectId}?token=${token}`)
}
