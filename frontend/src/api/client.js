import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const raw = localStorage.getItem('workflow-auth')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`
      }
    } catch (_) {}
  }
  return config
})

let isRefreshing = false
let queue = []

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return client(original)
          })
          .catch((err) => Promise.reject(err))
      }

      original._retry = true
      isRefreshing = true

      try {
        const raw = localStorage.getItem('workflow-auth')
        const { state } = JSON.parse(raw || '{}')
        const refreshToken = state?.refreshToken

        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(
          'http://localhost:8000/api/users/refresh',
          { refresh_token: refreshToken }
        )
        const newAccess = data.access_token

        // Update store
        const parsed = JSON.parse(raw)
        parsed.state.accessToken = newAccess
        localStorage.setItem('workflow-auth', JSON.stringify(parsed))

        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return client(original)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('workflow-auth')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default client
