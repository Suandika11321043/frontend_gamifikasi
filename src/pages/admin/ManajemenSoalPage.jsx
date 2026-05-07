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
                    <h1>Manajemen Soal</h1>
                </header>
                <p className="soal-subtitle">Pilih tema untuk mengelola soal</p>

                <div className="tema-toolbar">
                    <input
                        className="tema-search"
                        type="text"
                        placeholder="Cari tema..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="tema-count">{filtered.length} tema</span>
                </div>

                {fetchError && <p className="modal-error">{fetchError}</p>}

                {loading ? (
                    <p className="tema-loading">Memuat tema...</p>
                ) : filtered.length === 0 ? (
                    <div className="tema-empty">
                        <span className="tema-empty-icon">📂</span>
                        <p>Tidak ada tema ditemukan.</p>
                    </div>
                ) : (
                    <div className="tema-grid">
                        {filtered.map((tema) => (
                            <div
                                key={tema.id}
                                className="tema-card soal-tema-card"
                                onClick={() => navigate(`/admin/soal/${tema.id}`)}
                            >
                                <div className="tema-card-icon-wrap">
                                    <TopicIcon icon={tema.icon} name={tema.nameTopic} size="lg" />
                                </div>
                                <div className="tema-card-body">
                                    <h3 className="tema-card-name">{tema.nameTopic}</h3>
                                    <p className="tema-card-desc">
                                        {tema.description || <span className="tema-no-desc">—</span>}
                                    </p>
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
