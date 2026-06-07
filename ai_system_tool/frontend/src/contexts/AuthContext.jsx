import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
      const savedProfile = localStorage.getItem('userProfile')
      const profile = savedProfile ? JSON.parse(savedProfile) : {}
      setUser({ ...res.data, ...profile })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('userProfile')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    try {
      localStorage.setItem('userProfile', JSON.stringify(updatedUser))
    } catch {
      // ignore local storage errors
    }
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    localStorage.removeItem('userProfile')
    setUser(res.data.user)
    return res.data
  }

  const signup = async (email, name, password) => {
    const res = await api.post('/auth/signup', { email, name, password })
    localStorage.setItem('token', res.data.token)
    localStorage.removeItem('userProfile')
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userProfile')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
