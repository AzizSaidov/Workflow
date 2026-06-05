import client from './client'

export const profilesApi = {
  get: (userId) => client.get(`/profiles/${userId}`),
  getTop: (category) => client.get('/profiles/top', { params: category ? { category } : {} }),
  getAll: (category) => client.get('/profiles/all', { params: category ? { category } : {} }),
  updateMe: (data) => client.put('/profiles/me', data),
  addSkill: (skillId) => client.post('/profiles/me/skills', { skill_id: skillId }),
  removeSkill: (skillId) => client.delete(`/profiles/me/skills/${skillId}`),
  addLanguage: (languageId, level) => client.post('/profiles/me/languages', { language_id: languageId, level }),
  removeLanguage: (languageId) => client.delete(`/profiles/me/languages/${languageId}`),
  addCategory: (categoryId) => client.post('/profiles/me/categories', { category_id: categoryId }),
  removeCategory: (categoryId) => client.delete(`/profiles/me/categories/${categoryId}`),
  toggleLike: (userId) => client.post(`/profiles/${userId}/like`),
  getLikes: (userId) => client.get(`/profiles/${userId}/likes`),
}

export const usersApi = {
  list: (role) => client.get('/users/', { params: role ? { role } : {} }),
  getById: (id) => client.get(`/users/${id}`),
}
