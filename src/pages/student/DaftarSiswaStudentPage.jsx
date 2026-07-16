import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AvatarImg from '../../components/common/AvatarImg'
import StarsDisplay from '../../components/common/StarsDisplay'
import PoinIcon from '../../components/common/PoinIcon'
import './DaftarSiswaStudentPage.css'
import { apiFetch, getErrorMessage, unwrapList } from '../../utils/apiFetch'

const GROUP_TONES = ['sky', 'coral', 'mint', 'sun', 'violet', 'ocean']

function toneForGroup(group) {
    const key = (group ?? '').trim().toLowerCase()
    if (!key) return 'sky'
    if (key.includes('tk a') || key === 'a') return 'sky'
    if (key.includes('tk b') || key === 'b') return 'coral'
    if (key.includes('tk c') || key === 'c') return 'mint'
    if (key.includes('tk d') || key === 'd') return 'sun'
    let hash = 0
    for (let i = 0; i < key.length; i += 1) hash = (hash + key.charCodeAt(i) * (i + 1)) % GROUP_TONES.length
    return GROUP_TONES[hash]
}

function DaftarSiswaStudentPage() {
    const navigate = useNavigate()
    const [siswaList, setSiswaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')
    const [groupFilter, setGroupFilter] = useState('all')

    const fetchSiswa = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const data = await apiFetch('/students')
            setSiswaList(unwrapList(data))
        } catch (err) {
            setFetchError(getErrorMessage(err, 'Gagal memuat daftar murid. Silakan coba lagi.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchSiswa() }, [fetchSiswa])

    const groups = useMemo(() => {
        const set = new Set()
        siswaList.forEach((s) => {
            const g = (s.group ?? '').trim()
            if (g) set.add(g)
        })
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))
    }, [siswaList])

    const filtered = siswaList.filter((s) => {
        const q = search.toLowerCase()
        const matchSearch =
            (s.name ?? '').toLowerCase().includes(q) ||
            (s.group ?? '').toLowerCase().includes(q)
        const matchGroup = groupFilter === 'all' || (s.group ?? '').trim() === groupFilter
        return matchSearch && matchGroup
    })

    return (
        <div className="ds-wrapper">
            <header className="ds-header">
                <button className="ds-back-btn" onClick={() => navigate('/student')} aria-label="Kembali">
                    ← Kembali
                </button>
                <div className="ds-header-text">
                    <h1 className="ds-title">Daftar Murid</h1>
                    <p className="ds-subtitle">Pilih profil untuk mulai belajar</p>
                </div>
            </header>

            <div className="ds-toolbar">
                <input
                    className="ds-search"
                    type="text"
                    placeholder="Cari nama atau kelompok..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className="ds-count">{filtered.length} murid</span>
            </div>

            {groups.length > 0 && (
                <div className="ds-filters" role="group" aria-label="Filter kelompok TK">
                    <button
                        type="button"
                        className={`ds-filter-chip${groupFilter === 'all' ? ' is-active' : ''}`}
                        onClick={() => setGroupFilter('all')}
                    >
                        Semua
                    </button>
                    {groups.map((group) => {
                        const tone = toneForGroup(group)
                        return (
                            <button
                                key={group}
                                type="button"
                                className={`ds-filter-chip ds-filter-chip--${tone}${groupFilter === group ? ' is-active' : ''}`}
                                onClick={() => setGroupFilter(group)}
                            >
                                {group}
                            </button>
                        )
                    })}
                </div>
            )}

            {fetchError && <p className="ds-error">{fetchError}</p>}

            <div className="ds-grid">
                {loading ? (
                    <p className="ds-empty">Memuat data...</p>
                ) : filtered.length === 0 ? (
                    <p className="ds-empty">Tidak ada murid ditemukan.</p>
                ) : (
                    filtered.map((siswa) => {
                        const tone = toneForGroup(siswa.group)
                        return (
                            <div
                                className={`siswa-card siswa-card--${tone}`}
                                key={siswa.id}
                                onClick={() => navigate(`/student/siswa/${siswa.id}/topics`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/student/siswa/${siswa.id}/topics`)}
                            >
                                <div className="siswa-card__banner" aria-hidden="true" />
                                <div className="siswa-card__avatar-wrap">
                                    <AvatarImg avatar={siswa.avatar} name={siswa.name} size="xl" />
                                </div>
                                <div className="siswa-card__info">
                                    <p className="siswa-card__name">{siswa.name}</p>
                                    <span className="siswa-card__group">{siswa.group}</span>
                                </div>
                                <div className="siswa-card__stats">
                                    <span className="siswa-card__points">
                                        <PoinIcon size={24} />
                                        {siswa.totalEarnedScore ?? 0} poin
                                    </span>
                                    <StarsDisplay
                                        count={siswa.totalStars}
                                        className="siswa-card__stars"
                                        emptyFallback="—"
                                    />
                                </div>
                                <span className="siswa-card__cta">Pilih ▶</span>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default DaftarSiswaStudentPage
