import client from './client'

export const authApi = {
  register: (data) => client.post('/users/register', data),

  login: (email, password) =>
    client.post('/users/login', { email, password }),

  getMe: (token) => client.get('/users/me', token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined
  ),

  refresh: (refreshToken) =>
    client.post('/users/refresh', { refresh_token: refreshToken }),

  updateLocation: (lat, lng) =>
    client.post('/users/me/location', { lat, lng }),
}
