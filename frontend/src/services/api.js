import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
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

export default api
