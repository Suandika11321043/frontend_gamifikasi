import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoadingOverlay from './components/common/LoadingOverlay'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import DaftarSiswaPage from './pages/admin/DaftarSiswaPage'
import ManajemenTemaPage from './pages/admin/ManajemenTemaPage'
import ManajemenSoalPage from './pages/admin/ManajemenSoalPage'
import SoalByTemaPage from './pages/admin/SoalByTemaPage'
import StudentLandingPage from './pages/student/StudentLandingPage'
import DaftarSiswaStudentPage from './pages/student/DaftarSiswaStudentPage'
import ListTopicStudentPage from './pages/student/ListTopicStudentPage'
import QuizStudentPage from './pages/student/QuizStudentPage'
import './styles/App.css'

function AdminRoute({ children }) {
  const { isLoggedIn, expired } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location, expired }} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <>
      <LoadingOverlay />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/admin/siswa" element={<AdminRoute><DaftarSiswaPage /></AdminRoute>} />
        <Route path="/admin/tema" element={<AdminRoute><ManajemenTemaPage /></AdminRoute>} />
        <Route path="/admin/soal" element={<AdminRoute><ManajemenSoalPage /></AdminRoute>} />
        <Route path="/admin/soal/:topicId" element={<AdminRoute><SoalByTemaPage /></AdminRoute>} />
        <Route path="/student" element={<StudentLandingPage />} />
        <Route path="/student/daftar-siswa" element={<DaftarSiswaStudentPage />} />
        <Route path="/student/siswa/:studentId/topics" element={<ListTopicStudentPage />} />
        <Route path="/student/siswa/:studentId/topics/:topicId/quiz" element={<QuizStudentPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
