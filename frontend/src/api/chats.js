import client from './client'

export const chatsApi = {
  getHistory: (projectId) => client.get(`/chats/${projectId}`),
}

export function createChatWS(projectId, token) {
  return new WebSocket(`ws://localhost:8000/ws/chat/${projectId}?token=${token}`)
}
