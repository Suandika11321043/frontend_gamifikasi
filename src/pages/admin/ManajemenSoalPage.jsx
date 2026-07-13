import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ChevronRight } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import './ManajemenSoalPage.css'
import { apiFetch } from '../../utils/apiFetch'

import TopicIcon from '../../components/common/TopicIcon'
import Modal from '../../components/common/Modal'
import { IconLock } from '../../components/common/AppIcons'

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
    const [inactiveTopic, setInactiveTopic] = useState(null)

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

    const handleTopicClick = (tema) => {
        if (tema.isActive === false) {
            setInactiveTopic(tema)
            return
        }
        navigate(`/admin/soal/${tema.id}`)
    }

    return (
        <AdminLayout activePath="/admin/soal">
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

            <div className="page-toolbar">
                <div className="search-wrapper" style={{ maxWidth: 460 }}>
                    <span className="search-icon"><Search size={15} /></span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Cari nama atau deskripsi tema..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Cari tema"
                    />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch('')} title="Hapus pencarian" aria-label="Hapus pencarian">
                            <X size={14} />
                        </button>
                    )}
                </div>
                {!loading && (
                    <span className="count-badge">{filtered.length} dari {temaList.length} tema</span>
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
                    {filtered.map((tema) => {
                        const isInactive = tema.isActive === false
                        return (
                        <div
                            key={tema.id}
                            className={`tema-card soal-tema-card${isInactive ? ' tema-card-inactive soal-tema-card--locked' : ''}`}
                            onClick={() => handleTopicClick(tema)}
                            role="button"
                            tabIndex={0}
                            aria-label={
                                isInactive
                                    ? `Tema ${tema.nameTopic} belum diaktifkan`
                                    : `Kelola soal untuk tema ${tema.nameTopic}`
                            }
                            aria-disabled={isInactive}
                            onKeyDown={(e) => e.key === 'Enter' && handleTopicClick(tema)}
                        >
                            <div className="tema-card-icon-wrap">
                                <TopicIcon icon={tema.icon} name={tema.nameTopic} size="lg" />
                                {isInactive && <div className="soal-tema-lock" aria-hidden="true"><IconLock size={22} /></div>}
                            </div>
                            <div className="tema-card-body">
                                <h3 className="tema-card-name">{tema.nameTopic}</h3>
                                <p className="tema-card-desc">
                                    {tema.description || <span className="tema-no-desc">Belum ada deskripsi</span>}
                                </p>
                                {isInactive ? (
                                    <span className="soal-tema-inactive-badge">Tema nonaktif</span>
                                ) : tema.totalQuestions != null && (
                                    <span className="soal-q-count">{tema.totalQuestions} soal</span>
                                )}
                            </div>
                            <div className="tema-card-actions">
                                <button
                                    className={`btn-primary soal-kelola-btn${isInactive ? ' soal-kelola-btn--locked' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleTopicClick(tema)
                                    }}
                                >
                                    {isInactive ? <><IconLock size={14} /> Terkunci</> : <>Kelola Soal <ChevronRight size={14} /></>}
                                </button>
                            </div>
                        </div>
                        )
                    })}
                </div>
            )}

            {inactiveTopic && (
                <Modal
                    title="Tema Belum Aktif"
                    className="modal-confirm"
                    onClose={() => setInactiveTopic(null)}
                >
                    <p>
                        Silakan aktifkan tema <strong>{inactiveTopic.nameTopic}</strong> terlebih dahulu
                        melalui halaman Manajemen Tema.
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setInactiveTopic(null)}>
                            Tutup
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setInactiveTopic(null)
                                navigate('/admin/tema')
                            }}
                        >
                            Ke Manajemen Tema
                        </button>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    )
}

export default ManajemenSoalPage
