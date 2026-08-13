import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Lab from './pages/Lab'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/lab/*" element={<Lab />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
