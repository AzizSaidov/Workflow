import client from './client'

export const categoriesApi = {
  getAll: () => client.get('/categories/'),
  getSkills: (slug) => client.get(`/categories/${slug}/skills`),
}
