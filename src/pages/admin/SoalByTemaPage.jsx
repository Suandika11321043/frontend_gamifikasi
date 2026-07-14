import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BookOpen, Plus, Pencil, Copy, Trash2, Lock, Unlock } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/common/Modal'
import TopicIcon from '../../components/common/TopicIcon'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import './ManajemenSoalPage.css'
import { apiFetch } from '../../utils/apiFetch'
import { duplicateQuestionToDate } from '../../utils/duplicateQuestion'
import { appendQuestionUpdateFields, isWeekendDate } from '../../utils/validateFile'

const MONTHS = [
    { num: 1, label: 'Januari', short: 'Jan' },
    { num: 2, label: 'Februari', short: 'Feb' },
    { num: 3, label: 'Maret', short: 'Mar' },
    { num: 4, label: 'April', short: 'Apr' },
    { num: 5, label: 'Mei', short: 'Mei' },
    { num: 6, label: 'Juni', short: 'Jun' },
    { num: 7, label: 'Juli', short: 'Jul' },
    { num: 8, label: 'Agustus', short: 'Agu' },
    { num: 9, label: 'September', short: 'Sep' },
    { num: 10, label: 'Oktober', short: 'Okt' },
    { num: 11, label: 'November', short: 'Nov' },
    { num: 12, label: 'Desember', short: 'Des' },
]

const CAL_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const JSDAY_META = {
    1: { label: 'Senin', color: '#2563eb' },
    2: { label: 'Selasa', color: '#16a34a' },
    3: { label: 'Rabu', color: '#d97706' },
    4: { label: 'Kamis', color: '#9333ea' },
    5: { label: "Jum'at", color: '#dc2626' },
}

function padZ(n) { return String(n).padStart(2, '0') }

function toDateStr(y, m, d) {
    return `${y}-${padZ(m)}-${padZ(d)}`
}

function formatDisplayDate(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return dateStr
    const parts = dateStr.split('-')
    if (parts.length < 3) return dateStr
    const y = Number(parts[0])
    const m = Number(parts[1])
    const d = Number(parts[2])
    const jsDay = new Date(y, m - 1, d).getDay()
    const dayName = JSDAY_META[jsDay]?.label ?? (jsDay === 0 ? 'Minggu' : 'Sabtu')
    const monthName = MONTHS[m - 1]?.label ?? m
    return `${dayName}, ${d} ${monthName} ${y}`
}

function buildCells(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstJsDay = new Date(year, month - 1, 1).getDay()
    const offset = (firstJsDay + 6) % 7
    const cells = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
        const jsDay = new Date(year, month - 1, d).getDay()
        cells.push({ day: d, jsDay, meta: JSDAY_META[jsDay] ?? null })
    }
    return cells
}

function groupByDate(questions) {
    const map = {}
    for (const q of questions) {
        const key = q.learningDate ?? 'unknown'
        if (!map[key]) map[key] = 0
        map[key]++
    }
    return Object.entries(map)
        .filter(([k]) => k !== 'unknown')
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, count]) => ({ date, count }))
}

export default function SoalByTemaPage() {
    const { topicId } = useParams()
    const navigate = useNavigate()
    const [topic, setTopic] = useState(null)

    const now = new Date()
    const isTodayWeekend = now.getDay() === 0 || now.getDay() === 6
    const [calYear, setCalYear] = useState(now.getFullYear())
    const [calMonth, setCalMonth] = useState(now.getMonth() + 1)

    const [groups, setGroups] = useState([])
    const [activeDates, setActiveDates] = useState(new Set())
    const [loadingGroups, setLoadingGroups] = useState(true)
    const [groupError, setGroupError] = useState('')

    // Reschedule state
    const [rescheduleDate, setRescheduleDate] = useState(null)   // old date being edited
    const [newDate, setNewDate] = useState('')
    const [rescheduleErr, setRescheduleErr] = useState('')
    const [rescheduling, setRescheduling] = useState(false)

    // Duplicate to another date
    const [dupFromDate, setDupFromDate] = useState(null)
    const [dupNewDate, setDupNewDate] = useState('')
    const [dupErr, setDupErr] = useState('')
    const [duplicating, setDuplicating] = useState(false)

    // Delete all questions for a day
    const [deleteDate, setDeleteDate] = useState(null)
    const [deleteCount, setDeleteCount] = useState(0)
    const [deletingDay, setDeletingDay] = useState(false)
    const [deleteDayErr, setDeleteDayErr] = useState('')

    // Availability (locked/unlocked) per date
    const [availabilityMap, setAvailabilityMap] = useState({}) // date → boolean
    const [togglingDate, setTogglingDate] = useState(null)

    useEffect(() => {
        apiFetch(`/topics/${topicId}`).then(setTopic).catch(() => setTopic(null))
    }, [topicId])

    const fetchGroups = useCallback(async () => {
        setLoadingGroups(true)
        setGroupError('')
        try {
            const [data, availData] = await Promise.all([
                apiFetch(`/questions/topic/${topicId}`),
                apiFetch(`/questions/topic/${topicId}/learning-dates`).catch(() => []),
            ])
            const list = Array.isArray(data) ? data : (data?.data ?? [])
            const dateList = [...new Set(list.map((q) => q.learningDate).filter(Boolean))]
            setGroups(groupByDate(list))
            setActiveDates(new Set(dateList))
            const avMap = {}
            const availList = Array.isArray(availData) ? availData : (availData?.data ?? [])
            for (const item of availList) {
                if (item.learningDate) avMap[item.learningDate] = item.isAvailable === true
            }
            setAvailabilityMap(avMap)
        } catch (err) {
            setGroupError(err.message)
        } finally {
            setLoadingGroups(false)
        }
    }, [topicId])

    const handleToggleAvailability = async (date, currentAvailable, e) => {
        e.stopPropagation()
        setTogglingDate(date)
        try {
            await apiFetch(`/questions/topic/${topicId}/set-available`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learningDate: date, available: !currentAvailable }),
            })
            await fetchGroups()
        } catch (err) {
            setGroupError(err.message)
        } finally {
            setTogglingDate(null)
        }
    }

    useEffect(() => { fetchGroups() }, [fetchGroups])

    const prevMonth = () => {
        if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12) }
        else setCalMonth((m) => m - 1)
    }
    const nextMonth = () => {
        if (calMonth === 12) { setCalYear((y) => y + 1); setCalMonth(1) }
        else setCalMonth((m) => m + 1)
    }

    const handleDateClick = (day, meta) => {
        if (!meta) return // weekend
        navigate(`/admin/soal/${topicId}/date/${toDateStr(calYear, calMonth, day)}`)
    }

    const openReschedule = (date, e) => {
        e.stopPropagation()
        setRescheduleDate(date)
        setNewDate(date)
        setRescheduleErr('')
    }

    const handleReschedule = async () => {
        if (!newDate || newDate === rescheduleDate) { setRescheduleErr('Pilih tanggal yang berbeda.'); return }
        if (isWeekendDate(newDate)) { setRescheduleErr('Sabtu/Minggu bukan hari belajar.'); return }
        if (activeDates.has(newDate)) { setRescheduleErr(`Tanggal ${newDate} sudah memiliki soal. Pilih tanggal lain.`); return }
        setRescheduling(true); setRescheduleErr('')
        try {
            const list = await apiFetch(`/questions/topic/${topicId}/date/${rescheduleDate}`)
            const questions = Array.isArray(list) ? list : (list?.data ?? [])
            await Promise.all(
                questions.map((q) => {
                    const fd = new FormData()
                    appendQuestionUpdateFields(fd, q, { topicId, learningDate: newDate })
                    return apiFetch(`/questions/${q.id}`, { method: 'PUT', body: fd })
                })
            )
            setRescheduleDate(null)
            fetchGroups()
        } catch (err) { setRescheduleErr(err.message) }
        finally { setRescheduling(false) }
    }

    const openDuplicate = (date, e) => {
        e.stopPropagation()
        setDupFromDate(date)
        setDupNewDate('')
        setDupErr('')
    }

    const handleDuplicate = async () => {
        if (!dupNewDate) { setDupErr('Pilih tanggal tujuan.'); return }
        if (dupNewDate === dupFromDate) { setDupErr('Pilih tanggal yang berbeda.'); return }
        const [y, m, d] = dupNewDate.split('-').map(Number)
        const jsDay = new Date(y, m - 1, d).getDay()
        if (jsDay === 0 || jsDay === 6) { setDupErr('Sabtu/Minggu bukan hari belajar.'); return }
        if (activeDates.has(dupNewDate)) { setDupErr(`Tanggal ${formatDisplayDate(dupNewDate)} sudah memiliki soal. Pilih tanggal lain.`); return }
        setDuplicating(true); setDupErr('')
        try {
            const list = await apiFetch(`/questions/topic/${topicId}/date/${dupFromDate}`)
            const questions = Array.isArray(list) ? list : (list?.data ?? [])
            for (const q of questions) {
                await duplicateQuestionToDate(apiFetch, q.id, topicId, dupNewDate)
            }
            setDupFromDate(null)
            fetchGroups()
        } catch (err) { setDupErr(err.message) }
        finally { setDuplicating(false) }
    }

    const openDeleteDay = (date, count, e) => {
        e.stopPropagation()
        setDeleteDate(date)
        setDeleteCount(count)
        setDeleteDayErr('')
    }

    const handleDeleteDay = async () => {
        setDeletingDay(true); setDeleteDayErr('')
        try {
            const list = await apiFetch(`/questions/topic/${topicId}/date/${deleteDate}`)
            const questions = Array.isArray(list) ? list : (list?.data ?? [])
            await Promise.all(questions.map((q) => apiFetch(`/questions/${q.id}`, { method: 'DELETE' })))
            setDeleteDate(null)
            fetchGroups()
        } catch (err) { setDeleteDayErr(err.message) }
        finally { setDeletingDay(false) }
    }

    const cells = buildCells(calYear, calMonth)
    const monthLabel = MONTHS[calMonth - 1]?.label ?? ''

    return (
        <AdminLayout activePath="/admin/soal">
            <nav className="soal-breadcrumb">
                <button className="btn-back" onClick={() => navigate('/admin/soal')}>← Manajemen Soal</button>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{topic?.nameTopic ?? '...'}</span>
            </nav>

            <header className="dashboard-header">
                <div className="soal-header-title" style={{ gap: 12 }}>
                    {topic && <TopicIcon icon={topic.icon} name={topic.nameTopic} size="sm" />}
                    <div>
                        <h1>{topic?.nameTopic ?? '...'}</h1>
                        <p className="soal-subtitle">Pilih tanggal untuk membuka atau membuat soal</p>
                    </div>
                </div>
                <div className="soal-stats-badge">
                    <span className="soal-stats-num">{groups.length}</span>
                    <span className="soal-stats-label">Tanggal Aktif</span>
                </div>
            </header>

            <div className="flow-steps">
                <span className="flow-step flow-step--done">1. Tema</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step flow-step--active">2. Pilih Tanggal</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step">3. Kelola Soal</span>
            </div>

            <div className="tema-cal-layout">

                {/* ── Calendar Panel ── */}
                <div className="dp-panel tema-cal-panel">
                    {/* Year + Month nav */}
                    <div className="dp-panel-header dp-cal-nav">
                        <button className="dp-nav-btn" onClick={() => setCalYear((y) => y - 1)}>
                            «
                        </button>
                        <span className="dp-cal-year">{calYear}</span>
                        <button className="dp-nav-btn" onClick={() => setCalYear((y) => y + 1)}>
                            »
                        </button>
                    </div>

                    <div className="dp-panel-header dp-cal-nav" style={{ marginTop: -4 }}>
                        <button className="dp-nav-btn" onClick={prevMonth} disabled={calYear === now.getFullYear() - 2 && calMonth === 1}>
                            <ChevronLeft size={14} />
                        </button>
                        <span className="dp-panel-title dp-cal-title">{monthLabel} {calYear}</span>
                        <button className="dp-nav-btn" onClick={nextMonth}>
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="dp-legend">
                        {Object.values(JSDAY_META).map((m) => (
                            <span key={m.label} className="dp-legend-item" style={{ '--c': m.color, '--bg': m.color + '22' }}>
                                {m.label}
                            </span>
                        ))}
                        <span className="dp-legend-item dp-legend-wknd">Sab/Min</span>
                    </div>

                    {/* Calendar Grid */}
                    <div className="dp-calendar">
                        {CAL_HEADERS.map((h, i) => (
                            <div key={h} className={`dp-cal-header${i >= 5 ? ' dp-cal-header--wknd' : ''}`}>{h}</div>
                        ))}
                        {cells.map((cell, i) => {
                            if (!cell) return <div key={`e${i}`} className="dp-cal-empty" />
                            const { day, jsDay, meta } = cell
                            const dateStr = toDateStr(calYear, calMonth, day)
                            const isToday = dateStr === toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate())
                            const hasData = activeDates.has(dateStr)
                            const isWeekend = !meta
                            return (
                                <button
                                    key={day}
                                    className={[
                                        'dp-cal-cell',
                                        isWeekend ? 'dp-cal-cell--wknd' : '',
                                        isToday ? 'dp-cal-cell--today' : '',
                                        hasData ? 'dp-cal-cell--has-data' : '',
                                    ].filter(Boolean).join(' ')}
                                    style={meta ? { '--day-color': meta.color, '--day-bg': meta.color + '18' } : {}}
                                    disabled={isWeekend}
                                    onClick={() => handleDateClick(day, meta)}
                                    title={meta ? `${meta.label}, ${day} ${monthLabel} ${calYear}${hasData ? ' — ada soal' : ''}` : ''}
                                >
                                    <span className="dp-cal-num">{day}</span>
                                    {hasData && <span className="dp-cal-has-dot" />}
                                    {!hasData && meta && <span className="dp-cal-dot" />}
                                </button>
                            )
                        })}
                    </div>

                    <p className="dp-hint">
                        <span style={{ background: '#0f3460', borderRadius: 4, color: '#fff', padding: '1px 6px', fontSize: 10, marginRight: 4 }}>●</span>
                        Titik oranye = sudah ada soal. Klik tanggal untuk mengelola soal.
                    </p>
                </div>

                {/* ── Question Groups Panel ── */}
                <div className="dp-panel tema-groups-panel">
                    <div className="dp-panel-header">
                        <span className="dp-panel-icon"><BookOpen size={16} /></span>
                        <span className="dp-panel-title">Soal per Tanggal</span>
                        {!loadingGroups && (
                            <span className="soal-count-badge" style={{ marginLeft: 'auto' }}>
                                {groups.reduce((s, g) => s + g.count, 0)} soal
                            </span>
                        )}
                    </div>

                    {groupError && <p className="modal-error" style={{ marginBottom: 8 }}>{groupError}</p>}

                    {loadingGroups ? (
                        <div className="groups-loading">
                            {[1, 2, 3].map((i) => <div key={i} className="groups-skeleton" />)}
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="groups-empty">
                            <span className="groups-empty-icon">📝</span>
                            <p>Belum ada soal untuk tema ini.</p>
                            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                                Klik tanggal di kalender untuk mulai membuat soal.
                            </p>
                        </div>
                    ) : (
                        <div className="groups-list">
                            {groups.map(({ date, count }) => {
                                const parts = date.split('-')
                                const jsDay = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay()
                                const meta = JSDAY_META[jsDay]
                                const isAvailable = availabilityMap[date] ?? false
                                return (
                                    <div
                                        key={date}
                                        className={`group-item${isAvailable ? ' group-item--locked' : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        style={{ '--gcolor': meta?.color ?? '#6b7280', '--gbg': (meta?.color ?? '#6b7280') + '18' }}
                                        onClick={() => navigate(`/admin/soal/${topicId}/date/${date}`)}
                                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/soal/${topicId}/date/${date}`)}
                                    >
                                        <span className="group-item-dot" />
                                        <div className="group-item-body">
                                            <span className="group-item-date">{formatDisplayDate(date)}</span>
                                            <span className="group-item-count">{count} soal</span>
                                            {isAvailable && (
                                                <span className="group-item-avail-badge"><Lock size={10} /> Aktif</span>
                                            )}
                                        </div>
                                        <button
                                            className={`group-item-toggle-btn${isAvailable ? ' group-item-toggle-btn--on' : ' group-item-toggle-btn--off'}`}
                                            onClick={(e) => handleToggleAvailability(date, isAvailable, e)}
                                            title={isAvailable ? 'Nonaktifkan untuk siswa' : 'Aktifkan untuk siswa'}
                                            disabled={togglingDate === date}
                                        >
                                            {togglingDate === date
                                                ? <span className="group-item-toggle-spinner" />
                                                : isAvailable
                                                    ? <><Lock size={11} /> Aktif</>
                                                    : <><Unlock size={11} /> Nonaktif</>}
                                        </button>
                                        <button
                                            className="group-item-edit-btn"
                                            onClick={(e) => openReschedule(date, e)}
                                            title="Ubah tanggal"
                                            disabled={isAvailable}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            className="group-item-edit-btn"
                                            onClick={(e) => openDuplicate(date, e)}
                                            title="Duplikat ke hari lain"
                                        >
                                            <Copy size={12} />
                                        </button>
                                        <button
                                            className="group-item-edit-btn group-item-del-btn"
                                            onClick={(e) => openDeleteDay(date, count, e)}
                                            title="Hapus semua soal hari ini"
                                            disabled={isAvailable}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        <ChevronRight size={15} className="group-item-arrow" />
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <button
                        className="btn-primary groups-add-btn"
                        onClick={() => navigate(`/admin/soal/${topicId}/date/${toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate())}`)}
                        style={{ marginTop: 12 }}
                        disabled={isTodayWeekend}
                        title={isTodayWeekend ? 'Sabtu/Minggu bukan hari belajar' : 'Kelola soal hari ini'}
                    >
                        <Plus size={14} /> Soal Hari Ini
                    </button>
                </div>

            </div>

            {/* Modal Hapus Semua Soal Hari Ini */}
            {deleteDate && (
                <Modal title="Hapus Semua Soal Hari Ini?" onClose={() => setDeleteDate(null)}>
                    <p>Semua <strong>{deleteCount} soal</strong> pada <strong>{formatDisplayDate(deleteDate)}</strong> beserta seluruh opsinya akan dihapus secara permanen.</p>
                    {deleteDayErr && <p className="modal-error" style={{ marginTop: 8 }}>{deleteDayErr}</p>}
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setDeleteDate(null)} disabled={deletingDay}>Batal</button>
                        <button className="btn-danger" onClick={handleDeleteDay} disabled={deletingDay}>
                            {deletingDay ? 'Menghapus...' : '🗑 Hapus Semua'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Duplikat Soal */}
            {dupFromDate && (
                <Modal title="Duplikat Soal ke Hari Lain" onClose={() => setDupFromDate(null)}>
                    <div className="reschedule-info">
                        <span className="reschedule-from-label">Dari</span>
                        <span className="reschedule-from-date">{formatDisplayDate(dupFromDate)}</span>
                    </div>
                    {dupErr && <p className="modal-error">{dupErr}</p>}
                    <div className="form-group">
                        <label className="reschedule-to-label">Salin ke tanggal</label>
                        <input
                            type="date"
                            value={dupNewDate}
                            min={toDateStr(now.getFullYear() - 1, 1, 1)}
                            max={toDateStr(now.getFullYear() + 2, 12, 31)}
                            onChange={(e) => { setDupNewDate(e.target.value); setDupErr('') }}
                            className="reschedule-date-input"
                        />
                        {dupNewDate && (() => {
                            const [y, m, d] = dupNewDate.split('-').map(Number)
                            const jsDay = new Date(y, m - 1, d).getDay()
                            const isWeekend = jsDay === 0 || jsDay === 6
                            return isWeekend
                                ? <p className="reschedule-warn">⚠ Sabtu/Minggu bukan hari belajar.</p>
                                : <p className="reschedule-preview">{formatDisplayDate(dupNewDate)}</p>
                        })()}
                    </div>
                    <p className="reschedule-note">
                        Soal dari tanggal ini akan disalin ke tanggal baru beserta opsi, pasangan, gambar, dan keping puzzle.
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setDupFromDate(null)} disabled={duplicating}>Batal</button>
                        <button className="btn-primary" onClick={handleDuplicate}
                            disabled={duplicating || !dupNewDate || dupNewDate === dupFromDate}>
                            {duplicating ? 'Menyalin...' : '📋 Duplikat Soal'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Ubah Tanggal */}
            {rescheduleDate && (
                <Modal title="Ubah Tanggal Soal" onClose={() => setRescheduleDate(null)}>
                    <div className="reschedule-info">
                        <span className="reschedule-from-label">Dari</span>
                        <span className="reschedule-from-date">{formatDisplayDate(rescheduleDate)}</span>
                    </div>
                    {rescheduleErr && <p className="modal-error">{rescheduleErr}</p>}
                    <div className="form-group">
                        <label className="reschedule-to-label">Pindah ke tanggal</label>
                        <input
                            type="date"
                            value={newDate}
                            min={toDateStr(now.getFullYear() - 1, 1, 1)}
                            max={toDateStr(now.getFullYear() + 2, 12, 31)}
                            onChange={(e) => { setNewDate(e.target.value); setRescheduleErr('') }}
                            className="reschedule-date-input"
                        />
                        {newDate && (() => {
                            const [y, m, d] = newDate.split('-').map(Number)
                            const jsDay = new Date(y, m - 1, d).getDay()
                            const isWeekend = jsDay === 0 || jsDay === 6
                            return isWeekend
                                ? <p className="reschedule-warn">⚠ Sabtu/Minggu bukan hari belajar. Pilih hari lain.</p>
                                : <p className="reschedule-preview">{formatDisplayDate(newDate)}</p>
                        })()}
                    </div>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setRescheduleDate(null)} disabled={rescheduling}>Batal</button>
                        <button className="btn-primary" onClick={handleReschedule} disabled={rescheduling || !newDate || newDate === rescheduleDate}>
                            {rescheduling ? 'Memindahkan...' : '📅 Pindah Tanggal'}
                        </button>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    )
}
