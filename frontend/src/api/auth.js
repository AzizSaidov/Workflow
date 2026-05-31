import client from './client'

export const authApi = {
  register: (data) => client.post('/users/register', data),

  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return client.post('/users/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  getMe: (token) => client.get('/users/me', token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined
  ),

  refresh: (refreshToken) =>
    client.post('/users/refresh', { refresh_token: refreshToken }),
}
