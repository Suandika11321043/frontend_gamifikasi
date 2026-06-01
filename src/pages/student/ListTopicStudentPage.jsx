import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './ListTopicStudentPage.css'
import { apiFetch, BASE_URL } from '../../utils/apiFetch'

import TopicIcon from '../../components/common/TopicIcon'

function ListTopicStudentPage() {
    const { studentId } = useParams()
    const navigate = useNavigate()

    const [siswa, setSiswa] = useState(null)
    const [topics, setTopics] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')
    const [progressMap, setProgressMap] = useState({})

    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const [siswaData, topicsData] = await Promise.all([
                apiFetch(`/students/${studentId}`),
                apiFetch('/topics'),
            ])
            setSiswa(siswaData)
            const list = Array.isArray(topicsData) ? topicsData : []
            setTopics(list)
            // Fetch progress for each topic in parallel
            const results = await Promise.allSettled(
                list.map((t) => apiFetch(`/quiz/scores/students/${studentId}/topics/${t.id}`))
            )
            const pMap = {}
            list.forEach((t, i) => {
                if (results[i].status === 'fulfilled') pMap[t.id] = results[i].value
            })
            setProgressMap(pMap)
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [studentId])

    useEffect(() => { fetchData() }, [fetchData])

    const filtered = topics.filter((t) =>
        (t.nameTopic ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="lt-wrapper">
            {/* Background decorations */}
            <div className="lt-decoration lt-decoration--1" />
            <div className="lt-decoration lt-decoration--2" />

            <div className="lt-container">
                {/* Header */}
                <header className="lt-header">
                    <button
                        className="lt-back-btn"
                        onClick={() => navigate('/student/daftar-siswa')}
                        aria-label="Kembali"
                    >
                        ← Kembali
                    </button>

                    {siswa && (
                        <div className="lt-student-info">
                            <div className="lt-student-avatar">
                                {siswa.avatar
                                    ? <img src={siswa.avatar.startsWith('http') ? siswa.avatar : `${BASE_URL}/uploads/${siswa.avatar}`} alt={siswa.name} />
                                    : <span>{(siswa.name ?? '?').charAt(0).toUpperCase()}</span>
                                }
                            </div>
                            <div>
                                <p className="lt-student-name">{siswa.name}</p>
                                <p className="lt-student-meta">
                                    {siswa.group} · ⭐ {siswa.totalStars ?? 0} · Skor {siswa.totalEarnedScore ?? 0} · Rank {siswa.rankName ?? 'BEGINNER'}
                                </p>
                            </div>
                        </div>
                    )}
                </header>

                <h2 className="lt-title">📚 Pilih Topik</h2>
                <p className="lt-subtitle">Pilih topik yang ingin dikerjakan</p>

                {/* Search */}
                <div className="lt-toolbar">
                    <input
                        className="lt-search"
                        type="text"
                        placeholder="Cari topik..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="lt-count">{filtered.length} topik</span>
                </div>

                {/* Error */}
                {fetchError && <p className="lt-error">{fetchError}</p>}

                {/* Topics Grid */}
                {loading ? (
                    <p className="lt-empty">Memuat topik...</p>
                ) : filtered.length === 0 ? (
                    <p className="lt-empty">Tidak ada topik ditemukan.</p>
                ) : (
                    <div className="lt-grid">
                        {filtered.map((topic) => {
                            const isInactive = topic.isActive === false
                            return (
                                <div
                                    className={`lt-topic-card${isInactive ? ' lt-topic-card--disabled' : ''}`}
                                    key={topic.id}
                                    onClick={() => {
                                        if (isInactive) return
                                        navigate(`/student/siswa/${studentId}/topics/${topic.id}/quiz`)
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-disabled={isInactive}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isInactive)
                                            navigate(`/student/siswa/${studentId}/topics/${topic.id}/quiz`)
                                    }}
                                >
                                    <div className="lt-card-banner">
                                        <TopicIcon icon={topic.icon} name={topic.nameTopic} className="lt-topic-icon" placeholderClassName="lt-topic-placeholder" />
                                        {isInactive && <div className="lt-card-lock">🔒</div>}
                                    </div>
                                    <div className="lt-card-content">
                                        <p className="lt-topic-name">{topic.nameTopic}</p>
                                        {topic.description && <p className="lt-topic-desc">{topic.description}</p>}
                                        {isInactive ? (
                                            <span className="lt-topic-inactive-notice">Belum diaktifkan</span>
                                        ) : progressMap[topic.id] ? (
                                            <>
                                                <div className="lt-topic-progress">
                                                    <span className="lt-topic-stars">
                                                        {[1, 2, 3].map((s) => (
                                                            <span key={s} className={s <= (progressMap[topic.id].starCount ?? 0) ? 'lt-star--on' : 'lt-star--off'}>★</span>
                                                        ))}
                                                    </span>
                                                    <span className="lt-topic-score-pill">🏆 {progressMap[topic.id].totalEarnedScore ?? 0} poin</span>
                                                </div>
                                                <span className="lt-card-cta lt-cta--continue">Lanjutkan ▶</span>
                                            </>
                                        ) : (
                                            <span className="lt-card-cta lt-cta--start">Mulai ✨</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ListTopicStudentPage
