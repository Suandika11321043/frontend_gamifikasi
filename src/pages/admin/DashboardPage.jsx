import { useState, useEffect, useCallback } from 'react'
import { Users, Star, BookOpen, HelpCircle } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import AvatarImg from '../../components/common/AvatarImg'
import { apiFetch } from '../../utils/apiFetch'
import './DashboardPage.css'

const RANK_LABELS = {
    BEGINNER: 'Pemula',
    BRONZE: 'Perunggu',
    SILVER: 'Perak',
    GOLD: 'Emas',
    PLATINUM: 'Platinum',
    DIAMOND: 'Berlian',
}

function DashboardPage() {
    const [stats, setStats] = useState({ totalSoal: 0, totalStudents: 0, totalTopics: 0 })
    const [leaderboard, setLeaderboard] = useState([])
    const [topicGroups, setTopicGroups] = useState([])
    const [selectedTopicId, setSelectedTopicId] = useState('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchDashboard = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const [statsData, leaderboardData, topicData] = await Promise.all([
                apiFetch('/dashboard/stats'),
                apiFetch('/dashboard/students/by-total-points'),
                apiFetch('/dashboard/students/by-topic'),
            ])
            setStats(statsData ?? { totalSoal: 0, totalStudents: 0, totalTopics: 0 })
            setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : [])
            setTopicGroups(Array.isArray(topicData) ? topicData : [])
        } catch (err) {
            setError(err.message || 'Gagal memuat data dashboard')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchDashboard() }, [fetchDashboard])

    const statCards = [
        { label: 'Total Siswa', value: stats.totalStudents, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Total Soal', value: stats.totalSoal, icon: HelpCircle, color: '#10b981', bg: '#f0fdf4' },
        { label: 'Total Tema', value: stats.totalTopics, icon: BookOpen, color: '#8b5cf6', bg: '#f5f3ff' },
        { label: 'Total Poin Tertinggi', value: leaderboard[0]?.totalEarnedScore ?? 0, icon: Star, color: '#f59e0b', bg: '#fffbeb' },
    ]

    const activeTopicGroup = selectedTopicId === 'all'
        ? null
        : topicGroups.find((g) => String(g.topicId) === selectedTopicId)

    const topicStudents = selectedTopicId === 'all'
        ? []
        : (activeTopicGroup?.students ?? [])

    return (
        <AdminLayout activePath="/dashboard">
            <header className="dashboard-header">
                <h1>Dashboard Admin</h1>
                <span className="admin-badge">Admin</span>
            </header>

            {error && <div className="dashboard-error">{error}</div>}

            <section className="stats-grid">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div className="stat-card" key={stat.label}>
                            <div className="stat-icon-wrap" style={{ background: stat.bg }}>
                                <Icon size={22} color={stat.color} />
                            </div>
                            <div>
                                <p className="stat-value">{loading ? '—' : stat.value}</p>
                                <p className="stat-label">{stat.label}</p>
                            </div>
                        </div>
                    )
                })}
            </section>

            <section className="dashboard-section">
                <h2>Peringkat Siswa — Total Poin</h2>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Rank</th>
                                <th style={{ width: '70px' }}>Avatar</th>
                                <th>Nama Siswa</th>
                                <th>Kelompok</th>
                                <th>Total Poin</th>
                                <th>Bintang</th>
                                <th>Rank</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="empty-row">Memuat data...</td>
                                </tr>
                            ) : leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty-row">Belum ada data siswa.</td>
                                </tr>
                            ) : (
                                leaderboard.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <span className={`rank-badge rank-${s.rank <= 3 ? s.rank : 'other'}`}>
                                                {s.rank}
                                            </span>
                                        </td>
                                        <td>
                                            <AvatarImg src={s.avatar} alt={s.name} size={36} />
                                        </td>
                                        <td className="text-left">{s.name}</td>
                                        <td>{s.group || '—'}</td>
                                        <td><strong>{s.totalEarnedScore ?? 0}</strong></td>
                                        <td>{s.totalStars ?? 0} ⭐</td>
                                        <td>{RANK_LABELS[s.rankName] ?? s.rankName ?? '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="section-header-row">
                    <h2>Peringkat Siswa — Poin per Tema</h2>
                    <select
                        className="topic-filter-select"
                        value={selectedTopicId}
                        onChange={(e) => setSelectedTopicId(e.target.value)}
                    >
                        <option value="all">Pilih Tema</option>
                        {topicGroups.map((g) => (
                            <option key={g.topicId} value={String(g.topicId)}>
                                {g.topicName}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedTopicId === 'all' ? (
                    <div className="topic-overview-grid">
                        {loading ? (
                            <p className="empty-hint">Memuat data...</p>
                        ) : topicGroups.length === 0 ? (
                            <p className="empty-hint">Belum ada tema.</p>
                        ) : (
                            topicGroups.map((group) => {
                                const scoredStudents = group.students.filter((s) => (s.totalEarnedScore ?? 0) > 0)
                                return (
                                <div className="topic-overview-card" key={group.topicId}>
                                    <h3>{group.topicName}</h3>
                                    {scoredStudents.length === 0 ? (
                                        <p className="empty-hint">Belum ada skor.</p>
                                    ) : (
                                        <ol className="topic-mini-list">
                                            {scoredStudents.slice(0, 5).map((s) => (
                                                <li key={s.studentId}>
                                                    <span className="mini-rank">{s.rank}</span>
                                                    <span className="mini-name">{s.studentName}</span>
                                                    <span className="mini-score">{s.totalEarnedScore ?? 0} poin</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                    {scoredStudents.length > 5 && (
                                        <button
                                            type="button"
                                            className="view-all-btn"
                                            onClick={() => setSelectedTopicId(String(group.topicId))}
                                        >
                                            Lihat semua ({scoredStudents.length})
                                        </button>
                                    )}
                                </div>
                            )})
                        )}
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>Rank</th>
                                    <th style={{ width: '70px' }}>Avatar</th>
                                    <th>Nama Siswa</th>
                                    <th>Kelompok</th>
                                    <th>Poin Tema</th>
                                    <th>Bintang</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="empty-row">Memuat data...</td>
                                    </tr>
                                ) : topicStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="empty-row">
                                            Belum ada skor untuk tema {activeTopicGroup?.topicName ?? ''}.
                                        </td>
                                    </tr>
                                ) : (
                                    topicStudents.map((s) => (
                                        <tr key={s.studentId}>
                                            <td>
                                                <span className={`rank-badge rank-${s.rank <= 3 ? s.rank : 'other'}`}>
                                                    {s.rank}
                                                </span>
                                            </td>
                                            <td>
                                                <AvatarImg src={s.avatar} alt={s.studentName} size={36} />
                                            </td>
                                            <td className="text-left">{s.studentName}</td>
                                            <td>{s.studentGroup || '—'}</td>
                                            <td><strong>{s.totalEarnedScore ?? 0}</strong></td>
                                            <td>{s.starCount ?? 0} ⭐</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AdminLayout>
    )
}

export default DashboardPage
