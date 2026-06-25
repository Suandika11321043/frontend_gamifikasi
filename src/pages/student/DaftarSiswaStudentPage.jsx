import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AvatarImg from '../../components/common/AvatarImg'
import StarsDisplay from '../../components/common/StarsDisplay'
import './DaftarSiswaStudentPage.css'
import { apiFetch, BASE_URL } from '../../utils/apiFetch'

function DaftarSiswaStudentPage() {
    const navigate = useNavigate()
    const [siswaList, setSiswaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')

    const fetchSiswa = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const data = await apiFetch('/students')
            setSiswaList(Array.isArray(data) ? data : (data.data ?? []))
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchSiswa() }, [fetchSiswa])

    const filtered = siswaList.filter((s) =>
        (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.group ?? '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="ds-wrapper">
            {/* Header */}
            <header className="ds-header">
                <button className="ds-back-btn" onClick={() => navigate('/student')} aria-label="Kembali">
                    ← Kembali
                </button>
                <h1 className="ds-title">🏫 Daftar Siswa</h1>
            </header>

            {/* Search */}
            <div className="ds-toolbar">
                <input
                    className="ds-search"
                    type="text"
                    placeholder="Cari nama atau kelompok..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className="ds-count">{filtered.length} siswa</span>
            </div>

            {/* Error */}
            {fetchError && <p className="ds-error">{fetchError}</p>}

            {/* List */}
            <div className="ds-grid">
                {loading ? (
                    <p className="ds-empty">Memuat data...</p>
                ) : filtered.length === 0 ? (
                    <p className="ds-empty">Tidak ada siswa ditemukan.</p>
                ) : (
                    filtered.map((siswa) => (
                        <div
                            className="siswa-card"
                            key={siswa.id}
                            onClick={() => navigate(`/student/siswa/${siswa.id}/topics`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/student/siswa/${siswa.id}/topics`)}
                        >
                            <AvatarImg avatar={siswa.avatar} name={siswa.name} size="md" />
                            <div className="siswa-card__info">
                                <p className="siswa-card__name">{siswa.name}</p>
                                <div className="siswa-card__meta">
                                    <span className="siswa-card__group">{siswa.group}</span>
                                </div>
                            </div>
                            <div className="siswa-card__stats">
                                <span className="siswa-card__points">🏆 {siswa.totalEarnedScore ?? 0}</span>
                                <StarsDisplay
                                    count={siswa.totalStars}
                                    className="siswa-card__stars"
                                    emptyFallback="—"
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default DaftarSiswaStudentPage
