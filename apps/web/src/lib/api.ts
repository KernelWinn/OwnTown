import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

function getAuthState() {
  try {
    const raw = localStorage.getItem('auth-storage')
    return raw ? JSON.parse(raw)?.state ?? {} : {}
  } catch {
    return {}
  }
}

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const { accessToken } = getAuthState()
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { refreshToken } = getAuthState()
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        // update persisted store with new token
        const stored = getAuthState()
        localStorage.setItem('auth-storage', JSON.stringify({ state: { ...stored, accessToken: data.accessToken }, version: 0 }))
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
