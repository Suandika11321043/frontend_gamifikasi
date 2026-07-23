import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Sidebar.css'

const navGroups = [
    {
        label: 'Dashboard',
        path: '/dashboard',
        children: null,
    },
    {
        label: 'Manajemen Pembelajaran',
        children: [
            { label: 'Manajemen Soal', path: '/admin/soal' },
            { label: 'Manajemen Tema', path: '/admin/tema' },
        ],
    },
    {
        label: 'Profil dan Kemajuan Murid',
        children: [
            { label: 'Daftar Murid', path: '/admin/siswa' },
        ],
    },
]

function Sidebar({ activePath }) {
    const navigate = useNavigate()
    const { logout } = useAuth()

    const getInitialOpen = () =>
        navGroups.reduce((acc, group) => {
            if (group.children) {
                const isActive = group.children.some((c) => c.path === activePath)
                acc[group.label] = isActive
            }
            return acc
        }, {})

    const [openGroups, setOpenGroups] = useState(getInitialOpen)

    const toggleGroup = (label) =>
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">Gamifikasi</div>
            <nav className="sidebar-nav">
                {navGroups.map((group) =>
                    group.path ? (
                        <a
                            key={group.label}
                            href={group.path}
                            className={`nav-item${activePath === group.path ? ' active' : ''}`}
                        >
                            {group.label}
                        </a>
                    ) : (
                        <div key={group.label} className="nav-group">
                            <button
                                className={`nav-group-toggle${group.children.some((c) => c.path === activePath) ? ' active' : ''}`}
                                onClick={() => toggleGroup(group.label)}
                            >
                                <span>{group.label}</span>
                                <span className={`nav-arrow${openGroups[group.label] ? ' open' : ''}`}>▾</span>
                            </button>
                            {openGroups[group.label] && (
                                <div className="nav-sub">
                                    {group.children.map((item) => (
                                        <a
                                            key={item.path}
                                            href={item.path}
                                            className={`nav-sub-item${activePath === item.path ? ' active' : ''}`}
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                )}
            </nav>
            <button className="logout-btn" onClick={handleLogout}>
                Keluar
            </button>
        </aside>
    )
}

export default Sidebar
