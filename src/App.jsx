import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoadingOverlay from './components/common/LoadingOverlay'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import DaftarSiswaPage from './pages/admin/DaftarSiswaPage'
import ManajemenTemaPage from './pages/admin/ManajemenTemaPage'
import ManajemenSoalPage from './pages/admin/ManajemenSoalPage'
import SoalByTemaPage from './pages/admin/SoalByTemaPage'
import SoalByWeekPage from './pages/admin/SoalByWeekPage'
import SoalByDayPage from './pages/admin/SoalByDayPage'
import SoalQuestionsPage from './pages/admin/SoalQuestionsPage'
import StudentLandingPage from './pages/student/StudentLandingPage'
import DaftarSiswaStudentPage from './pages/student/DaftarSiswaStudentPage'
import ListTopicStudentPage from './pages/student/ListTopicStudentPage'
import WeekStudentPage from './pages/student/WeekStudentPage'
import DayStudentPage from './pages/student/DayStudentPage'
import QuizStudentPage from './pages/student/QuizStudentPage'
import HistoryAnswerPage from './pages/student/HistoryAnswerPage'
import './styles/App.css'

function AdminRoute({ children }) {
  const { isLoggedIn, expired } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location, expired }} replace />
  }
  return children
}

// Hapus token admin saat berada di area siswa (/student/...)
function ClearTokenOnStudentRoute() {
  const location = useLocation()
  const { clearToken } = useAuth()

  useEffect(() => {
    const onStudentArea = location.pathname === '/student'
      || location.pathname.startsWith('/student/')
    if (onStudentArea) {
      clearToken()
    }
  }, [location.pathname, clearToken])

  return null
}

function AppRoutes() {
  return (
    <>
      <ClearTokenOnStudentRoute />
      <LoadingOverlay />
      <Routes>
        <Route path="/" element={<Navigate to="/student" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/admin/siswa" element={<AdminRoute><DaftarSiswaPage /></AdminRoute>} />
        <Route path="/admin/tema" element={<AdminRoute><ManajemenTemaPage /></AdminRoute>} />
        <Route path="/admin/soal" element={<AdminRoute><ManajemenSoalPage /></AdminRoute>} />
        <Route path="/admin/soal/:topicId" element={<AdminRoute><SoalByTemaPage /></AdminRoute>} />
        <Route path="/admin/soal/:topicId/date/:learningDate" element={<AdminRoute><SoalQuestionsPage /></AdminRoute>} />
        <Route path="/admin/soal/:topicId/year/:year" element={<AdminRoute><SoalByWeekPage /></AdminRoute>} />
        <Route path="/admin/soal/:topicId/year/:year/week/:weekNumber" element={<AdminRoute><SoalByDayPage /></AdminRoute>} />
        <Route path="/student" element={<StudentLandingPage />} />
        <Route path="/student/daftar-siswa" element={<DaftarSiswaStudentPage />} />
        <Route path="/student/siswa/:studentId/topics" element={<ListTopicStudentPage />} />
        <Route path="/student/siswa/:studentId/topics/:topicId/weeks" element={<WeekStudentPage />} />
        <Route path="/student/siswa/:studentId/topics/:topicId/dates/:learningDate/quiz" element={<QuizStudentPage />} />
        <Route path="/student/siswa/:studentId/topics/:topicId/dates/:learningDate/review" element={<HistoryAnswerPage />} />
        <Route path="/student/siswa/:studentId/topics/:topicId/weeks/:weekId/days" element={<DayStudentPage />} />
        <Route path="/student/siswa/:studentId/topics/:topicId/weeks/:weekId/days/:dayId/quiz" element={<QuizStudentPage />} />
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
