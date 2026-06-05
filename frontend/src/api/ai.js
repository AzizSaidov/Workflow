import client from './client'

export const aiApi = {
  helpBid: (project_title, project_description, skills = []) =>
    client.post('/ai/help-bid', { project_title, project_description, skills }),

  helpProject: (title, rough_description, category = '', budget = '') =>
    client.post('/ai/help-project', { title, rough_description, category, budget }),

  // history = [{role: 'user'|'assistant', content: '...'}]
  chat: (message, history = [], context = null) =>
    client.post('/ai/chat', { message, history, context }),

  // action: 'improve' | 'shorten' | 'translate'
  editText: (text, action) =>
    client.post('/ai/edit-text', { text, action }),

  helpDeliver: (project_title, project_description = '') =>
    client.post('/ai/help-deliver', { project_title, project_description }),

  // AI-ранжирование заявок на странице проекта (возвращает JSON-строку с order/reasons)
  rankBids: (project_title, budget, description, bids_summary) =>
    client.post('/ai/rank-bids', { project_title, budget, description, bids_summary }),
}
