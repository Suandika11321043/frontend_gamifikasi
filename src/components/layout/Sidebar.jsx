import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
    BookOpen,
    Palette,
    Users,
    LogOut,
    ChevronDown,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react'
import '../../styles/Sidebar.css'

const navGroups = [
    {
        label: 'Manajemen Pembelajaran',
        icon: <BookOpen size={18} />,
        children: [
            { label: 'Manajemen Soal', path: '/admin/soal', icon: <BookOpen size={16} /> },
            { label: 'Manajemen Tema', path: '/admin/tema', icon: <Palette size={16} /> },
        ],
    },
    {
        label: 'Profil dan Kemajuan Siswa',
        icon: <Users size={18} />,
        children: [
            { label: 'Daftar Siswa', path: '/admin/siswa', icon: <Users size={16} /> },
        ],
    },
]

function Sidebar({ activePath, mobileOpen = false, onMobileClose }) {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const [collapsed, setCollapsed] = useState(false)

    const getInitialOpen = () =>
        navGroups.reduce((acc, group) => {
            const isActive = group.children.some((c) => c.path === activePath)
            acc[group.label] = isActive
            return acc
        }, {})

    const [openGroups, setOpenGroups] = useState(getInitialOpen)

    const toggleGroup = (label) => {
        if (collapsed) {
            setCollapsed(false)
            setOpenGroups((prev) => ({ ...prev, [label]: true }))
        } else {
            setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}>
            <div className="sidebar-header">
                {!collapsed && <div className="sidebar-brand">Gamifikasi</div>}
                <button
                    className="sidebar-toggle"
                    onClick={() => {
                        if (onMobileClose && mobileOpen) {
                            onMobileClose()
                        } else {
                            setCollapsed((v) => !v)
                        }
                    }}
                    title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
                >
                    {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navGroups.map((group) => {
                    const isGroupActive = group.children.some((c) => c.path === activePath)
                    return (
                        <div key={group.label} className="nav-group">
                            <button
                                className={`nav-group-toggle${isGroupActive ? ' active' : ''}`}
                                onClick={() => toggleGroup(group.label)}
                                title={collapsed ? group.label : undefined}
                            >
                                <span className="nav-group-icon">{group.icon}</span>
                                {!collapsed && (
                                    <>
                                        <span className="nav-group-label">{group.label}</span>
                                        <span className="nav-arrow">
                                            {openGroups[group.label]
                                                ? <ChevronDown size={14} />
                                                : <ChevronRight size={14} />}
                                        </span>
                                    </>
                                )}
                            </button>
                            {!collapsed && openGroups[group.label] && (
                                <div className="nav-sub">
                                    {group.children.map((item) => (
                                        <a
                                            key={item.path}
                                            href={item.path}
                                            className={`nav-sub-item${activePath === item.path ? ' active' : ''}`}
                                        >
                                            <span className="nav-sub-icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            <button
                className="logout-btn"
                onClick={handleLogout}
                title={collapsed ? 'Keluar' : undefined}
            >
                <LogOut size={16} />
                {!collapsed && <span>Keluar</span>}
            </button>
        </aside>
    )
}

export default Sidebar
