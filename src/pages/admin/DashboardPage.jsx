import Sidebar from '../../components/Sidebar'
import './DashboardPage.css'

const STATS = [
    { label: 'Total Murid', value: '4', icon: '👥' },
    { label: 'Total Soal', value: '13', icon: '❓' },
    { label: 'Total Tema', value: '2', icon: '📚' },
]

function DashboardPage() {
    return (
        <div className="dashboard-wrapper">
            <Sidebar activePath="/dashboard" />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h1>Dashboard Guru</h1>
                </header>

                <section className="stats-grid">
                    {STATS.map((stat) => (
                        <div className="stat-card" key={stat.label}>
                            <span className="stat-icon">{stat.icon}</span>
                            <div>
                                <p className="stat-value">{stat.value}</p>
                                <p className="stat-label">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    )
}

export default DashboardPage
