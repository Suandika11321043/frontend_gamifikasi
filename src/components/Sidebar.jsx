import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Sidebar.css'

const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Manajemen Level', path: '/admin/level' },
    { label: 'Tugas', path: '/admin/tugas' },
    { label: 'Badge', path: '/admin/badge' },
    { label: 'Leaderboard', path: '/admin/leaderboard' },
]

function Sidebar({ activePath }) {
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">Gamifikasi</div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <a
                        key={item.path}
                        href={item.path}
                        className={`nav-item${activePath === item.path ? ' active' : ''}`}
                    >
                        {item.label}
                    </a>
                ))}
            </nav>
            <button className="logout-btn" onClick={handleLogout}>
                Keluar
            </button>
        </aside>
    )
}

export default Sidebar
