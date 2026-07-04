import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import './ManajemenSoalPage.css'
import { apiFetch } from '../../utils/apiFetch'

const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const CAL_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const JS_DAY_TO_API = { 1: 'SENIN', 2: 'SELASA', 3: 'RABU', 4: 'KAMIS', 5: 'JUMAT' }

const DAY_META = {
    SENIN:  { label: 'Senin',   color: '#2563eb', bg: '#dbeafe' },
    SELASA: { label: 'Selasa',  color: '#16a34a', bg: '#dcfce7' },
    RABU:   { label: 'Rabu',    color: '#d97706', bg: '#fef3c7' },
    KAMIS:  { label: 'Kamis',   color: '#9333ea', bg: '#f3e8ff' },
    JUMAT:  { label: "Jumat",  color: '#dc2626', bg: '#fee2e2' },
}

function buildCells(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstJsDay  = new Date(year, month - 1, 1).getDay()
    const offset = (firstJsDay + 6) % 7
    const cells = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
        const jsDay = new Date(year, month - 1, d).getDay()
        cells.push({ day: d, apiDay: JS_DAY_TO_API[jsDay] ?? null })
    }
    return cells
}

function CalendarGrid({ year, month, onSelect }) {
    const cells = buildCells(year, month)
    const now = new Date()
    const isThisMonth = now.getFullYear() === year && now.getMonth() + 1 === month

    return (
        <div className="dp-calendar">
            {CAL_HEADERS.map((h, i) => (
                <div key={h} className={`dp-cal-header${i >= 5 ? ' dp-cal-header--wknd' : ''}`}>{h}</div>
            ))}
            {cells.map((cell, i) => {
                if (!cell) return <div key={`e${i}`} className="dp-cal-empty" />
                const { day, apiDay } = cell
                const isWeekend = !apiDay
                const isToday   = isThisMonth && now.getDate() === day
                const meta = apiDay ? DAY_META[apiDay] : null
                return (
                    <button
                        key={day}
                        className={[
                            'dp-cal-cell',
                            isWeekend ? 'dp-cal-cell--wknd'  : '',
                            isToday   ? 'dp-cal-cell--today' : '',
                        ].filter(Boolean).join(' ')}
                        style={meta ? { '--day-color': meta.color, '--day-bg': meta.bg } : {}}
                        disabled={isWeekend}
                        onClick={() => meta && onSelect(apiDay)}
                        title={meta ? meta.label : ''}
                    >
                        <span className="dp-cal-num">{day}</span>
                        {meta && <span className="dp-cal-dot" />}
                    </button>
                )
            })}
        </div>
    )
}

function SoalByDayPage() {
    const { topicId, year, weekNumber } = useParams()
    const navigate = useNavigate()
    const [topic, setTopic] = useState(null)

    useEffect(() => {
        apiFetch(`/topics/${topicId}`).then(setTopic).catch(() => setTopic(null))
    }, [topicId])

    const monthLabel = MONTHS[Number(weekNumber)] ?? `Bulan ${weekNumber}`

    const handleSelect = (apiDay) =>
        navigate(`/admin/soal/${topicId}/year/${year}/week/${weekNumber}/day/${apiDay}`)

    return (
        <AdminLayout activePath="/admin/soal">
            <nav className="soal-breadcrumb">
                <button className="btn-back" onClick={() => navigate('/admin/soal')}>← Manajemen Soal</button>
                <span className="breadcrumb-sep">/</span>
                <button className="btn-back" onClick={() => navigate(`/admin/soal/${topicId}`)}>{topic?.nameTopic ?? '...'}</button>
                <span className="breadcrumb-sep">/</span>
                <button className="btn-back" onClick={() => navigate(`/admin/soal/${topicId}/year/${year}`)}>{year}</button>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{monthLabel}</span>
            </nav>

            <header className="dashboard-header">
                <div>
                    <h1>{monthLabel} {year}</h1>
                    <p className="soal-subtitle">Klik tanggal untuk membuka soal</p>
                </div>
            </header>

            <div className="flow-steps">
                <span className="flow-step flow-step--done">1. Tema</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step flow-step--done">2. Tahun</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step flow-step--done">3. Tanggal</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step flow-step--active">4. Soal</span>
            </div>

            <div className="dp-panel" style={{ maxWidth: 480 }}>
                <div className="dp-panel-header">
                    <span className="dp-panel-icon">📅</span>
                    <span className="dp-panel-title dp-cal-title">{monthLabel} {year}</span>
                </div>

                <div className="dp-legend">
                    {Object.entries(DAY_META).map(([key, meta]) => (
                        <span
                            key={key}
                            className="dp-legend-item"
                            style={{ '--c': meta.color, '--bg': meta.bg }}
                        >
                            {meta.label}
                        </span>
                    ))}
                    <span className="dp-legend-item dp-legend-wknd">Sabtu/Minggu</span>
                </div>

                <CalendarGrid
                    year={Number(year)}
                    month={Number(weekNumber)}
                    onSelect={handleSelect}
                />

                <p className="dp-hint">
                    Sabtu &amp; Minggu tidak tersedia. Tanggal hari ini ditandai dengan lingkaran.
                </p>
            </div>
        </AdminLayout>
    )
}

export default SoalByDayPage
