import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function App() {
  return (
    <BrowserRouter>
      <LoadingOverlay />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/siswa" element={<DaftarSiswaPage />} />
        <Route path="/admin/tema" element={<ManajemenTemaPage />} />
        <Route path="/admin/soal" element={<ManajemenSoalPage />} />
        <Route path="/admin/soal/:topicId" element={<SoalByTemaPage />} />
        <Route path="/student" element={<StudentLandingPage />} />
        <Route path="/student/daftar-siswa" element={<DaftarSiswaStudentPage />} />
        <Route path="/student/siswa/:studentId/topics" element={<ListTopicStudentPage />} />
        <Route path="/student/siswa/:studentId/topics/:topicId/quiz" element={<QuizStudentPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
