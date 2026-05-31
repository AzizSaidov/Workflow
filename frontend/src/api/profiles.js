import client from './client'

export const profilesApi = {
  get: (userId) => client.get(`/profiles/${userId}`),
  updateMe: (data) => client.put('/profiles/me', data),
  addSkill: (skillId) => client.post('/profiles/me/skills', { skill_id: skillId }),
  removeSkill: (skillId) => client.delete(`/profiles/me/skills/${skillId}`),
  addLanguage: (languageId, level) => client.post('/profiles/me/languages', { language_id: languageId, level }),
  removeLanguage: (languageId) => client.delete(`/profiles/me/languages/${languageId}`),
}
