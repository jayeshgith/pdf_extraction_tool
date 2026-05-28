import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
    }
    const msg = err.response?.data?.detail || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  },
)

export const uploadDocument = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
}

export const getDocument = (id) => api.get(`/documents/${id}`)

export const listDocuments = (page = 1, limit = 10) =>
  api.get('/documents', { params: { page, limit } })

export const deleteDocument = (id) => api.delete(`/documents/${id}`)

export const updateDocument = (id, data) => api.put(`/documents/${id}`, data)

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })

export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password })

export const askQuestion = (docId, question) => api.post(`/chat/${docId}`, { question })

export default api
