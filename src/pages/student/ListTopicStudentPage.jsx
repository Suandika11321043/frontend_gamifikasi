import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './ListTopicStudentPage.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function apiFetch(path) {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch(`${BASE_URL}${path}`, { headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.')
    return data
}

function TopicIcon({ icon, name }) {
    if (icon) {
        const src = icon.startsWith('http') ? icon : `${BASE_URL}/uploads/${icon}`
        return <img src={src} alt={name} className="lt-topic-icon" />
    }
    return (
        <div className="lt-topic-placeholder">
            {(name ?? '?').charAt(0).toUpperCase()}
        </div>
    )
}

function ListTopicStudentPage() {
    const { studentId } = useParams()
    const navigate = useNavigate()

    const [siswa, setSiswa] = useState(null)
    const [topics, setTopics] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const [siswaData, topicsData] = await Promise.all([
                apiFetch(`/students/${studentId}`),
                apiFetch('/topics'),
            ])
            setSiswa(siswaData)
            setTopics(Array.isArray(topicsData) ? topicsData : [])
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
                                    {siswa.group} · ⭐ {siswa.totalStars ?? 0} · Skor {siswa.totalEarnedScore ?? 0}
                                </p>
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
                        {filtered.map((topic) => (
                            <div
                                className="lt-topic-card"
                                key={topic.id}
                                onClick={() => navigate(`/student/siswa/${studentId}/topics/${topic.id}/quiz`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/student/siswa/${studentId}/topics/${topic.id}/quiz`)}
                            >
                                <TopicIcon icon={topic.icon} name={topic.nameTopic} />
                                <div className="lt-topic-body">
                                    <p className="lt-topic-name">{topic.nameTopic}</p>
                                    {topic.description && (
                                        <p className="lt-topic-desc">{topic.description}</p>
                                    )}
                                </div>
                                <span className="lt-topic-arrow">›</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ListTopicStudentPage
