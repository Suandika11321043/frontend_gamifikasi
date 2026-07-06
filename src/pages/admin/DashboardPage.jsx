import Sidebar from '../../components/Sidebar'
import './DashboardPage.css'

const STATS = [
    { label: 'Total Siswa', value: '4', icon: '👥' },
    { label: 'Total Soal', value: '13', icon: '❓' },
    { label: 'Total Tema', value: '2', icon: '📚' },
    { label: 'Total Poin Tertinggi', value: '618', icon: '⭐' },
]

const LEADERBOARD = [
    { rank: 1, name: 'ILHAM', group: 'TK A', points: 618, stars: 9 },
    { rank: 2, name: 'ANWAR', group: 'TK B', points: 320, stars: 5 },
    { rank: 3, name: 'RAHMAT', group: 'TK A', points: 276, stars: 4 },
    { rank: 4, name: 'JOKO', group: 'TK B', points: 11, stars: 0 },
]

const TOPIC_RANKINGS = {
    kewarganegaraan: [
        { name: 'ILHAM', points: 618 },
        { name: 'ANWAR', points: 120 },
        { name: 'RAHMAT', points: 80 },
        { name: 'JOKO', points: 0 },
    ],
    keagamaan: [],
}

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function DashboardPage() {
    return (
        <div className="dashboard-wrapper">
            <Sidebar activePath="/dashboard" />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h1>Dashboard Admin</h1>
                    <span className="admin-badge">Admin</span>
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

                <section className="dashboard-section">
                    <h2>Peringkat Siswa — Total Poin</h2>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Avatar</th>
                                    <th>Nama Siswa</th>
                                    <th>Kelompok</th>
                                    <th>Total Poin</th>
                                    <th>Bintang</th>
                                </tr>
                            </thead>
                            <tbody>
                                {LEADERBOARD.map((row) => (
                                    <tr key={row.name}>
                                        <td>{MEDALS[row.rank] ?? row.rank}</td>
                                        <td>
                                            <span className="dash-avatar">
                                                {row.name.charAt(0)}
                                            </span>
                                        </td>
                                        <td className="dash-name">{row.name}</td>
                                        <td>{row.group}</td>
                                        <td>
                                            <span className="badge badge--points">{row.points}</span>
                                        </td>
                                        <td>{row.stars} ⭐</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="dashboard-section dashboard-section--topics">
                    <div className="section-header">
                        <h2>Peringkat Siswa — Poin per Tema</h2>
                        <select className="topic-filter" defaultValue="kewarganegaraan" aria-label="Pilih tema">
                            <option value="kewarganegaraan">Kewarganegaraan</option>
                            <option value="keagamaan">Keagamaan</option>
                        </select>
                    </div>
                    <div className="topic-rank-grid">
                        <div className="topic-rank-card">
                            <h3>Kewarganegaraan</h3>
                            <ul className="topic-rank-list">
                                {TOPIC_RANKINGS.kewarganegaraan.map((s, i) => (
                                    <li key={s.name}>
                                        <span>{i + 1}. {s.name}</span>
                                        <span className="topic-rank-points">{s.points}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="topic-rank-card topic-rank-card--empty">
                            <h3>Keagamaan</h3>
                            <div className="topic-rank-empty">
                                <span className="topic-rank-empty-icon">📦</span>
                                <p>Belum ada skor.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default DashboardPage
