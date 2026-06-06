import client from './client'

export const aiApi = {
  helpBid: (project_title, project_description, skills = [], freelancerProfile = {}, freelancer_notes = '') =>
    client.post('/ai/help-bid', {
      project_title, project_description, skills,
      freelancer_name: freelancerProfile.name || '',
      freelancer_title: freelancerProfile.title || '',
      freelancer_bio: freelancerProfile.bio || '',
      freelancer_jobs: freelancerProfile.total_jobs || 0,
      freelancer_rating: freelancerProfile.rating ? String(freelancerProfile.rating) : '',
      freelancer_notes,
    }),

  helpProject: (title, rough_description, category = '', budget = '') =>
    client.post('/ai/help-project', { title, rough_description, category, budget }),

  chat: (message, history = [], context = null) =>
    client.post('/ai/chat', { message, history, context }),

  editText: (text, action) =>
    client.post('/ai/edit-text', { text, action }),

  helpDeliver: (project_title, project_description = '', work_notes = '', links = '') =>
    client.post('/ai/help-deliver', { project_title, project_description, work_notes, links }),

  rankBids: (project_title, budget, description, bids_summary) =>
    client.post('/ai/rank-bids', { project_title, budget, description, bids_summary }),
}
