import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import './DashboardPage.css'

const stats = [
    { label: 'Total Pengguna', value: '0', icon: '👥' },
    { label: 'Total Poin', value: '0', icon: '⭐' },
    { label: 'Badge Diberikan', value: '0', icon: '🏅' },
    { label: 'Tugas Selesai', value: '0', icon: '✅' },
]

function DashboardPage() {
    return (
        <div className="dashboard-wrapper">
            <Sidebar activePath="/dashboard" />

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h1>Dashboard Admin</h1>
                    <span className="admin-badge">Admin</span>
                </header>

                {/* Stat Cards */}
                <section className="stats-grid">
                    {stats.map((stat) => (
                        <div className="stat-card" key={stat.label}>
                            <span className="stat-icon">{stat.icon}</span>
                            <div>
                                <p className="stat-value">{stat.value}</p>
                                <p className="stat-label">{stat.label}</p>
                            </div>
                        </div>
                    ))}
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
            </main>
        </div>
    )
}

export default DashboardPage
