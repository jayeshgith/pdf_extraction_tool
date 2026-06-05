import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './layouts/Layout'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import ExtractionPage from './pages/ExtractionPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ChatPage from './pages/ChatPage'
import AdminConfigsPage from './pages/AdminConfigsPage'
import BulkUploadPage from './pages/BulkUploadPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="/extraction/:id" element={<ProtectedRoute><ExtractionPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminConfigsPage /></ProtectedRoute>} />
      <Route path="/bulk" element={<ProtectedRoute><BulkUploadPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
