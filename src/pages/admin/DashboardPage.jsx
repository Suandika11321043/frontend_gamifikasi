import { useState, useEffect, useCallback } from 'react'
import { Users, Star, BookOpen, HelpCircle } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import AvatarImg from '../../components/common/AvatarImg'
import PoinIcon from '../../components/common/PoinIcon'
import { apiFetch } from '../../utils/apiFetch'
import '../../styles/common.css'
import './DashboardPage.css'

function formatPositionBadge(position) {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return position
}

function PositionCell({ position }) {
    const pos = position ?? 0
    return (
        <span className={`rank-badge rank-${pos <= 3 ? pos : 'other'}${pos <= 3 ? ' rank-badge--medal' : ''}`}>
            {formatPositionBadge(pos)}
        </span>
    )
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
        { label: 'Total Murid', value: stats.totalStudents, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Total Soal', value: stats.totalSoal, icon: HelpCircle, color: '#10b981', bg: '#f0fdf4' },
        { label: 'Total Tema', value: stats.totalTopics, icon: BookOpen, color: '#8b5cf6', bg: '#f5f3ff' },
        { label: 'Total Poin Tertinggi', value: leaderboard[0]?.totalEarnedScore ?? 0, icon: 'poin', color: '#d97706', bg: '#fffbeb' },
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
                <h1>Dashboard Guru</h1>
                <span className="admin-badge">Guru</span>
            </header>

            {error && <div className="dashboard-error">{error}</div>}

            <section className="stats-grid">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div className="stat-card" key={stat.label}>
                            <div className="stat-icon-wrap" style={{ background: stat.bg }}>
                                {Icon === 'poin' ? (
                                    <PoinIcon size={32} />
                                ) : (
                                    <Icon size={22} color={stat.color} />
                                )}
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
                <h2>Peringkat Murid — Total Poin</h2>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th style={{ width: '70px' }}>Avatar</th>
                                <th>Nama Murid</th>
                                <th>Kelompok</th>
                                <th>Total Poin</th>
                                <th>Bintang</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="empty-row">Memuat data...</td>
                                </tr>
                            ) : leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="empty-row">Belum ada data murid.</td>
                                </tr>
                            ) : (
                                leaderboard.map((s, idx) => {
                                    const position = s.rank ?? idx + 1
                                    return (
                                    <tr key={s.id}>
                                        <td><PositionCell position={position} /></td>
                                        <td>
                                            <AvatarImg avatar={s.avatar} name={s.name} size="sm" />
                                        </td>
                                        <td className="text-left">{s.name}</td>
                                        <td>{s.group || '—'}</td>
                                        <td>
                                            <span className="poin-badge">
                                                <PoinIcon size={22} />
                                                {s.totalEarnedScore ?? 0}
                                                <span className="poin-badge__unit">poin</span>
                                            </span>
                                        </td>
                                        <td>{s.totalStars ?? 0} ⭐</td>
                                    </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="section-header-row">
                    <h2>Peringkat Murid — Poin per Tema</h2>
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
                                                {scoredStudents.slice(0, 5).map((s, idx) => {
                                                    const position = s.rank ?? idx + 1
                                                    return (
                                                    <li key={s.studentId}>
                                                        <span className={`mini-rank${position <= 3 ? ' mini-rank--medal' : ''}`}>
                                                            {formatPositionBadge(position)}
                                                        </span>
                                                        <span className="mini-name">{s.studentName}</span>
                                                        <span className="mini-score">
                                                            <PoinIcon size={20} />
                                                            {s.totalEarnedScore ?? 0} poin
                                                        </span>
                                                    </li>
                                                    )
                                                })}
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
                                )
                            })
                        )}
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>No</th>
                                    <th style={{ width: '70px' }}>Avatar</th>
                                    <th>Nama Murid</th>
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
                                    topicStudents.map((s, idx) => {
                                        const position = s.rank ?? idx + 1
                                        return (
                                        <tr key={s.studentId}>
                                            <td><PositionCell position={position} /></td>
                                            <td>
                                                <AvatarImg avatar={s.avatar} name={s.studentName} size="sm" />
                                            </td>
                                            <td className="text-left">{s.studentName}</td>
                                            <td>{s.studentGroup || '—'}</td>
                                            <td>
                                            <span className="poin-badge">
                                                <PoinIcon size={22} />
                                                {s.totalEarnedScore ?? 0}
                                                <span className="poin-badge__unit">poin</span>
                                            </span>
                                        </td>
                                            <td>{s.starCount ?? 0} ⭐</td>
                                        </tr>
                                        )
                                    })
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
