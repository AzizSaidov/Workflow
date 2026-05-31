import client from './client'

export const authApi = {
  register: (data) => client.post('/users/register', data),

  // Backend accepts JSON LoginRequest, returns { access_token, refresh_token, user }
  login: (email, password) =>
    client.post('/users/login', { email, password }),

  getMe: (token) => client.get('/users/me', token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined
  ),

  refresh: (refreshToken) =>
    client.post('/users/refresh', { refresh_token: refreshToken }),
}
