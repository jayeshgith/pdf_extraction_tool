import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/auth/me')
      setUser({
        ...res.data,
        avatarUrl: res.data.avatar_url || res.data.avatarUrl,
      })
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser({
      ...res.data.user,
      avatarUrl: res.data.user.avatar_url || res.data.user.avatarUrl,
    })
    return res.data
  }

  const signup = async (email, name, password) => {
    const res = await api.post('/auth/signup', { email, name, password })
    localStorage.setItem('token', res.data.token)
    setUser({
      ...res.data.user,
      avatarUrl: res.data.user.avatar_url || res.data.user.avatarUrl,
    })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
