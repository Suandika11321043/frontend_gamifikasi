import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import '../../components/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import './ManajemenSoalPage.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    if (res.status === 204) return null
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.')
    return data
}

function TopicIcon({ icon, name, size = 'sm' }) {
    const sizeClass = `topic-icon--${size}`
    if (icon) return <img src={icon} alt={name} className={`topic-icon-img ${sizeClass}`} />
    return (
        <div className={`topic-icon-placeholder ${sizeClass}`}>
            {(name ?? '?').charAt(0).toUpperCase()}
        </div>
    )
}

function SkeletonCard() {
    return (
        <div className="tema-card soal-skeleton-card" aria-hidden="true">
            <div className="soal-skeleton soal-skeleton-icon" />
            <div className="soal-skeleton soal-skeleton-title" />
            <div className="soal-skeleton soal-skeleton-desc" />
            <div className="soal-skeleton soal-skeleton-btn" />
        </div>
    )
}

function ManajemenSoalPage() {
    const navigate = useNavigate()
    const [temaList, setTemaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')

    const fetchTema = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const data = await apiFetch('/topics')
            setTemaList(Array.isArray(data) ? data : [])
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchTema() }, [fetchTema])

    const filtered = temaList.filter((t) =>
        (t.nameTopic ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="dashboard-wrapper">
            <Sidebar activePath="/admin/soal" />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1>Manajemen Soal</h1>
                        <p className="soal-subtitle">Pilih tema di bawah untuk mengelola soal-soalnya</p>
                    </div>
                    {!loading && (
                        <div className="soal-stats-badge">
                            <span className="soal-stats-num">{temaList.length}</span>
                            <span className="soal-stats-label">Total Tema</span>
                        </div>
                    )}
                </header>

                <div className="soal-toolbar-row">
                    <div className="soal-search-wrap">
                        <span className="soal-search-icon" aria-hidden="true">🔍</span>
                        <input
                            className="tema-search soal-search-input"
                            type="text"
                            placeholder="Cari nama atau deskripsi tema..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Cari tema"
                        />
                        {search && (
                            <button
                                className="soal-search-clear"
                                onClick={() => setSearch('')}
                                title="Hapus pencarian"
                                aria-label="Hapus pencarian"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {!loading && (
                        <span className="tema-count">
                            {filtered.length} dari {temaList.length} tema
                        </span>
                    )}
                </div>

                {fetchError && (
                    <div className="soal-error-banner" role="alert">
                        <span aria-hidden="true">⚠️</span>
                        <span>{fetchError}</span>
                        <button className="btn-back" onClick={fetchTema}>Coba lagi</button>
                    </div>
                )}

                {loading ? (
                    <div className="tema-grid soal-tema-grid" aria-label="Memuat data...">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="tema-empty">
                        <span className="tema-empty-icon">{search ? '🔍' : '📂'}</span>
                        <p>
                            {search
                                ? `Tidak ada tema yang cocok dengan "${search}"`
                                : 'Belum ada tema tersedia.'}
                        </p>
                        {search && (
                            <button
                                className="btn-primary"
                                style={{ marginTop: 8 }}
                                onClick={() => setSearch('')}
                            >
                                Hapus Pencarian
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="tema-grid soal-tema-grid">
                        {filtered.map((tema) => (
                            <div
                                key={tema.id}
                                className="tema-card soal-tema-card"
                                onClick={() => navigate(`/admin/soal/${tema.id}`)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Kelola soal untuk tema ${tema.nameTopic}`}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/soal/${tema.id}`)}
                            >
                                <div className="tema-card-icon-wrap">
                                    <TopicIcon icon={tema.icon} name={tema.nameTopic} size="lg" />
                                </div>
                                <div className="tema-card-body">
                                    <h3 className="tema-card-name">{tema.nameTopic}</h3>
                                    <p className="tema-card-desc">
                                        {tema.description || <span className="tema-no-desc">Belum ada deskripsi</span>}
                                    </p>
                                    {tema.totalQuestions != null && (
                                        <span className="soal-q-count">{tema.totalQuestions} soal</span>
                                    )}
                                </div>
                                <div className="tema-card-actions">
                                    <button
                                        className="btn-primary soal-kelola-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            navigate(`/admin/soal/${tema.id}`)
                                        }}
                                    >
                                        Kelola Soal →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default ManajemenSoalPage
