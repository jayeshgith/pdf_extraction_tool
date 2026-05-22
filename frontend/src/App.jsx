import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'
import UploadPage from './pages/UploadPage'
import ExtractionPage from './pages/ExtractionPage'
import DocumentListPage from './pages/DocumentListPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/upload" replace />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/extraction/:id" element={<ExtractionPage />} />
        <Route path="/documents" element={<DocumentListPage />} />
      </Routes>
    </Layout>
  )
}

export default App
