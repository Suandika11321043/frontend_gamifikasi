import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import './ManajemenSoalPage.css'
import { apiFetch } from '../../utils/apiFetch'

const MONTHS = [
    { num: 1,  label: 'Januari' },
    { num: 2,  label: 'Februari' },
    { num: 3,  label: 'Maret' },
    { num: 4,  label: 'April' },
    { num: 5,  label: 'Mei' },
    { num: 6,  label: 'Juni' },
    { num: 7,  label: 'Juli' },
    { num: 8,  label: 'Agustus' },
    { num: 9,  label: 'September' },
    { num: 10, label: 'Oktober' },
    { num: 11, label: 'November' },
    { num: 12, label: 'Desember' },
]

const CAL_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

// JS getDay(): 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const JS_DAY_TO_API = { 1: 'SENIN', 2: 'SELASA', 3: 'RABU', 4: 'KAMIS', 5: 'JUMAT' }

const DAY_META = {
    SENIN:  { label: 'Senin',   color: '#2563eb', bg: '#dbeafe' },
    SELASA: { label: 'Selasa',  color: '#16a34a', bg: '#dcfce7' },
    RABU:   { label: 'Rabu',    color: '#d97706', bg: '#fef3c7' },
    KAMIS:  { label: 'Kamis',   color: '#9333ea', bg: '#f3e8ff' },
    JUMAT:  { label: "Jum'at",  color: '#dc2626', bg: '#fee2e2' },
}

function buildCells(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstJsDay  = new Date(year, month - 1, 1).getDay()
    const offset = (firstJsDay + 6) % 7 // Monday = 0
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

function SoalByWeekPage() {
    const { topicId, year } = useParams()
    const navigate = useNavigate()
    const [topic, setTopic] = useState(null)

    const now = new Date()
    const currentYear  = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const [selectedMonth, setSelectedMonth] = useState(
        Number(year) === currentYear ? currentMonth : 1
    )

    useEffect(() => {
        apiFetch(`/topics/${topicId}`).then(setTopic).catch(() => setTopic(null))
    }, [topicId])

    const selectedLabel = MONTHS.find((m) => m.num === selectedMonth)?.label ?? ''

    const handleSelect = (apiDay) =>
        navigate(`/admin/soal/${topicId}/year/${year}/week/${selectedMonth}/day/${apiDay}`)

    return (
        <AdminLayout activePath="/admin/soal">
            <nav className="soal-breadcrumb">
                <button className="btn-back" onClick={() => navigate('/admin/soal')}>← Manajemen Soal</button>
                <span className="breadcrumb-sep">/</span>
                <button className="btn-back" onClick={() => navigate(`/admin/soal/${topicId}`)}>{topic?.nameTopic ?? '...'}</button>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">Tahun {year}</span>
            </nav>

            <header className="dashboard-header">
                <div>
                    <h1>Pilih Tanggal</h1>
                    <p className="soal-subtitle">Tahun {year} &mdash; klik tanggal untuk membuka soal</p>
                </div>
            </header>

            <div className="flow-steps">
                <span className="flow-step flow-step--done">1. Tema</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step flow-step--done">2. Tahun</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step flow-step--active">3. Tanggal</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step">4. Soal</span>
            </div>

            <div className="dp-layout">

                {/* ── Month Selector ── */}
                <div className="dp-panel">
                    <div className="dp-panel-header">
                        <span className="dp-panel-icon">📅</span>
                        <span className="dp-panel-title">Pilih Bulan</span>
                    </div>
                    <div className="dp-month-grid">
                        {MONTHS.map((m) => {
                            const isCurrent  = m.num === currentMonth && Number(year) === currentYear
                            const isSelected = m.num === selectedMonth
                            return (
                                <button
                                    key={m.num}
                                    className={[
                                        'dp-month-btn',
                                        isSelected ? 'dp-month-btn--sel' : '',
                                        isCurrent && !isSelected ? 'dp-month-btn--cur' : '',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => setSelectedMonth(m.num)}
                                    title={m.label}
                                >
                                    <span className="dp-month-num">{String(m.num).padStart(2, '0')}</span>
                                    <span className="dp-month-name">{m.label}</span>
                                    {isCurrent && !isSelected && <span className="dp-cur-dot" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Calendar ── */}
                <div className="dp-panel">
                    <div className="dp-panel-header dp-cal-nav">
                        <button
                            className="dp-nav-btn"
                            onClick={() => setSelectedMonth((m) => Math.max(1, m - 1))}
                            disabled={selectedMonth === 1}
                        >&#8249;</button>
                        <span className="dp-panel-title dp-cal-title">{selectedLabel} {year}</span>
                        <button
                            className="dp-nav-btn"
                            onClick={() => setSelectedMonth((m) => Math.min(12, m + 1))}
                            disabled={selectedMonth === 12}
                        >&#8250;</button>
                    </div>

                    {/* Legend */}
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
                        month={selectedMonth}
                        onSelect={handleSelect}
                    />

                    <p className="dp-hint">
                        Sabtu &amp; Minggu tidak tersedia. Tanggal hari ini ditandai dengan lingkaran.
                    </p>
                </div>

            </div>
        </AdminLayout>
    )
}

export default SoalByWeekPage
