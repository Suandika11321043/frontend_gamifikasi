import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './ListTopicStudentPage.css'
import { apiFetch } from '../../utils/apiFetch'

import TopicIcon from '../../components/common/TopicIcon'
import StarsDisplay from '../../components/common/StarsDisplay'
import AvatarImg from '../../components/common/AvatarImg'

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
                                <AvatarImg
                                    avatar={siswa.avatar}
                                    name={siswa.name}
                                    size="lg"
                                    showNameplate={false}
                                />
                            </div>
                            <div className="lt-student-text">
                                <p className="lt-student-name">{siswa.name}</p>
                                <div className="lt-student-meta">
                                    {siswa.group && (
                                        <span className="lt-student-chip">{siswa.group}</span>
                                    )}
                                    {(siswa.totalStars ?? 0) > 0 && (
                                        <span className="lt-student-chip lt-student-chip--star">
                                            <StarsDisplay
                                                count={siswa.totalStars}
                                                className="lt-student-meta-stars"
                                            />
                                        </span>
                                    )}
                                    <span className="lt-student-chip lt-student-chip--score">
                                        Skor {siswa.totalEarnedScore ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                <h2 className="lt-title">📚 Pilih Tema</h2>
                <p className="lt-subtitle">Pilih tema yang ingin dikerjakan</p>

                {/* Search */}
                <div className="lt-toolbar">
                    <input
                        className="lt-search"
                        type="text"
                        placeholder="Cari tema..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="lt-count">{filtered.length} tema</span>
                </div>

                {/* Error */}
                {fetchError && <p className="lt-error">{fetchError}</p>}

                {/* Topics Grid */}
                {loading ? (
                    <p className="lt-empty">Memuat tema...</p>
                ) : filtered.length === 0 ? (
                    <p className="lt-empty">Tidak ada tema ditemukan.</p>
                ) : (
                    <div className="lt-grid">
                        {filtered.map((topic) => {
                            const isInactive = topic.isActive === false
                            const progress = progressMap[topic.id]
                            const topicStars = progress?.starCount ?? 0
                            const topicScore = progress?.totalEarnedScore ?? 0
                            const hasProgress = topicStars > 0 || topicScore > 0
                            return (
                                <div
                                    className={`lt-topic-card${isInactive ? ' lt-topic-card--disabled' : ''}`}
                                    key={topic.id}
                                    onClick={() => {
                                        if (isInactive) return
                                        navigate(`/student/siswa/${studentId}/topics/${topic.id}/weeks`)
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-disabled={isInactive}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isInactive)
                                            navigate(`/student/siswa/${studentId}/topics/${topic.id}/weeks`)
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
                                        ) : (
                                            <>
                                                <div className="lt-topic-progress">
                                                    <StarsDisplay
                                                        count={topicStars}
                                                        className="lt-topic-stars"
                                                        textLabel="bintang"
                                                        emptyFallback="—"
                                                    />
                                                    {topicScore > 0 && (
                                                        <span className="lt-topic-score-pill">🏆 {topicScore} poin</span>
                                                    )}
                                                </div>
                                                <span className={`lt-card-cta ${hasProgress ? 'lt-cta--continue' : 'lt-cta--start'}`}>
                                                    {hasProgress ? 'Lanjutkan ▶' : 'Mulai ✨'}
                                                </span>
                                            </>
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
