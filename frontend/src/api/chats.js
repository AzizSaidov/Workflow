import client from './client'

export const chatsApi = {
  getHistory: (projectId) => client.get(`/chats/${projectId}`),
  getHidden: () => client.get('/chats/hidden'),
  hideChat: (projectId) => client.post(`/chats/${projectId}/hide`),
  editMessage: (projectId, messageId, content) => client.put(`/chats/${projectId}/messages/${messageId}`, { content }),
  deleteMessage: (projectId, messageId) => client.delete(`/chats/${projectId}/messages/${messageId}`),
  uploadFile: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export function createChatWS(projectId, token) {
  return new WebSocket(`ws://localhost:8000/ws/chat/${projectId}?token=${token}`)
}
