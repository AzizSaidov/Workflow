import client from './client'

export const aiApi = {
  helpBid: (project_title, project_description, skills = []) =>
    client.post('/ai/help-bid', { project_title, project_description, skills }),
  helpProject: (title, rough_description, category = '', budget = '') =>
    client.post('/ai/help-project', { title, rough_description, category, budget }),
  chat: (message, context = null) =>
    client.post('/ai/chat', { message, context }),
}
