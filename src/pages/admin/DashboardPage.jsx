import { Users, Star, Award, CheckCircle } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import './DashboardPage.css'

const stats = [
    { label: 'Total Pengguna', value: '0', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Poin', value: '0', icon: Star, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Badge Diberikan', value: '0', icon: Award, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Tugas Selesai', value: '0', icon: CheckCircle, color: '#10b981', bg: '#f0fdf4' },
]

function DashboardPage() {
    return (
        <AdminLayout activePath="/dashboard">
            <header className="dashboard-header">
                <h1>Dashboard Admin</h1>
                <span className="admin-badge">Admin</span>
            </header>

            {/* Stat Cards */}
            <section className="stats-grid">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div className="stat-card" key={stat.label}>
                            <div className="stat-icon-wrap" style={{ background: stat.bg }}>
                                <Icon size={22} color={stat.color} />
                            </div>
                            <div>
                                <p className="stat-value">{stat.value}</p>
                                <p className="stat-label">{stat.label}</p>
                            </div>
                        </div>
                    )
                })}
            </section>

            {/* Placeholder Table */}
            <section className="dashboard-section">
                <h2>Aktivitas Terbaru</h2>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Pengguna</th>
                                <th>Aktivitas</th>
                                <th>Poin</th>
                                <th>Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} className="empty-row">Belum ada aktivitas.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    )
}

export default DashboardPage
