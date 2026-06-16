import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../utils/apiFetch'
import TopicIcon from '../../components/common/TopicIcon'
import './WeekStudentPage.css'

const JSDAY_META = {
    1: { label: 'Senin', emoji: '☀️', color: '#f59e0b', bg: 'linear-gradient(135deg,#fbbf24,#f97316)' },
    2: { label: 'Selasa', emoji: '🔥', color: '#ef4444', bg: 'linear-gradient(135deg,#f97316,#ef4444)' },
    3: { label: 'Rabu', emoji: '🌿', color: '#10b981', bg: 'linear-gradient(135deg,#34d399,#10b981)' },
    4: { label: 'Kamis', emoji: '💧', color: '#3b82f6', bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)' },
    5: { label: "Jum'at", emoji: '⭐', color: '#6366f1', bg: 'linear-gradient(135deg,#818cf8,#6366f1)' },
}

const MONTH_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const jsDay = d.getDay()
    return {
        meta: JSDAY_META[jsDay],
        dayNum: d.getDate(),
        month: MONTH_NAMES[d.getMonth() + 1],
        year: d.getFullYear(),
    }
}

// ── Map layout constants ───────────────────────────────────────────
const MAP_W = 320
const NODE_R = 36
const NODE_SZ = NODE_R * 2   // 72
const COL_L = 72             // center-x of left-column nodes
const COL_R = 248            // center-x of right-column nodes
const ROW_H = 130            // vertical distance between node centers
const PAD_T = 55
const PAD_B = 72

function nX(i) { return i % 2 === 0 ? COL_L : COL_R }
function nY(i) { return PAD_T + i * ROW_H }
function mapH(n) { return PAD_T + Math.max(n - 1, 0) * ROW_H + NODE_SZ + PAD_B }

// Smooth bezier path through all node centers
function buildPath(n) {
    if (n < 2) return ''
    let d = ''
    for (let i = 0; i < n - 1; i++) {
        const x1 = nX(i), y1 = nY(i)
        const x2 = nX(i + 1), y2 = nY(i + 1)
        const midY = (y1 + y2) / 2
        if (i === 0) d = `M ${x1} ${y1} `
        d += `C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2} `
    }
    return d.trim()
}

export default function WeekStudentPage() {
    const { studentId, topicId } = useParams()
    const navigate = useNavigate()

    const [topic, setTopic] = useState(null)
    const [dateGroups, setDateGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [completedDates, setCompletedDates] = useState(new Set())
    const [progressDates, setProgressDates] = useState({})

    const fetchData = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const [topicData, grouped] = await Promise.all([
                apiFetch(`/topics/${topicId}`),
                apiFetch(`/questions/topic/${topicId}/student/${studentId}`).catch(() => []),
            ])
            setTopic(topicData)
            const groupList = Array.isArray(grouped) ? grouped : (grouped?.data ?? [])

            const completed = new Set()
            const progress = {}
            groupList.forEach(({ learningDate, questions }) => {
                const qList = (Array.isArray(questions) ? questions : []).filter((q) => q.isAvailable === true)
                const total = qList.length
                const answeredCount = qList.filter((q) => q.status === 'SELESAI').length
                progress[learningDate] = {
                    answered: answeredCount,
                    total,
                    pct: total > 0 ? Math.round((answeredCount / total) * 100) : 0,
                }
                if (total > 0 && answeredCount === total) completed.add(learningDate)
            })
            setCompletedDates(completed)
            setProgressDates(progress)

            setDateGroups(
                groupList
                    .filter((g) => g.learningDate)
                    .sort((a, b) => a.learningDate.localeCompare(b.learningDate))
                    .map(({ learningDate, questions }) => ({
                        date: learningDate,
                        count: (questions ?? []).filter((q) => q.isAvailable === true).length,
                    }))
                    .filter((g) => g.count > 0)
            )
        } catch (err) { setError(err.message) }
        finally { setLoading(false) }
    }, [topicId, studentId])

    useEffect(() => { fetchData() }, [fetchData])

    const svgPath = buildPath(dateGroups.length)
    const h = mapH(dateGroups.length)

    return (
        <div className="wsp-wrapper">
            {dateGroups.length !== 1 && [...Array(18)].map((_, i) => <div key={i} className="wsp-star" style={{ '--si': i }} />)}

            <div className="wsp-container">
                {/* Header */}
                <header className="wsp-header">
                    <button className="wsp-back-btn" onClick={() => navigate(`/student/siswa/${studentId}/topics`)}>
                        ← Kembali
                    </button>
                    <div className="wsp-topic-badge">
                        <TopicIcon icon={topic?.icon} name={topic?.nameTopic} className="wsp-topic-icon" placeholderClassName="wsp-topic-icon-ph" />
                        <span>{topic?.nameTopic ?? '...'}</span>
                    </div>
                </header>

                {/* Hero */}
                <div className="wsp-hero">
                    <div className="wsp-hero-emoji">🗺️</div>
                    <h1 className="wsp-title">Peta Belajar</h1>
                    <p className="wsp-subtitle">Pilih level untuk mulai mengerjakan soal ✨</p>
                </div>

                {error && <p className="wsp-error">{error}</p>}

                {loading ? (
                    <div className="wsp-loading-wrap">
                        <div className="wsp-spinner" />
                        <p className="wsp-loading-text">Memuat peta...</p>
                    </div>
                ) : dateGroups.length === 0 ? (
                    <div className="wsp-empty">
                        <span className="wsp-empty-icon">📭</span>
                        <p>Belum ada soal untuk topik ini.</p>
                    </div>
                ) : (
                    <div className="wsp-map-wrap">
                        <div className="wsp-map" style={{ height: h }}>

                            {/* ── SVG winding road ── */}
                            <svg className="wsp-map-svg" width={MAP_W} height={h} aria-hidden="true">
                                <defs>
                                    <filter id="map-glow" x="-60%" y="-60%" width="220%" height="220%">
                                        <feGaussianBlur stdDeviation="5" result="b" />
                                        <feMerge>
                                            <feMergeNode in="b" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                {/* Wide glow halo */}
                                <path d={svgPath} fill="none" stroke="rgba(139,92,246,0.18)" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Outer road edge */}
                                <path d={svgPath} fill="none" stroke="rgba(167,139,250,0.35)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Dashed center line */}
                                <path d={svgPath} fill="none" stroke="rgba(196,181,253,0.85)" strokeWidth="4" strokeDasharray="16 10" strokeLinecap="round" filter="url(#map-glow)" />
                            </svg>

                            {/* 🚀 Start marker */}
                            {dateGroups.length > 1 && (
                                <span className="wsp-map-marker wsp-map-marker--start"
                                    style={{ left: nX(0) - 18, top: nY(0) - NODE_R - 44 }}>

                                </span>
                            )}

                            {/* ── Level nodes ── */}
                            {dateGroups.map(({ date, count }, idx) => {
                                const { meta, dayNum, month, year } = formatDate(date)
                                const isLeft = idx % 2 === 0
                                const isDone = completedDates.has(date)
                                const prog = progressDates[date]
                                const isInProgress = !isDone && prog && prog.answered > 0
                                return (
                                    <div
                                        key={date}
                                        className="wsp-map-item"
                                        style={{ left: nX(idx) - NODE_R, top: nY(idx) - NODE_R }}
                                    >
                                        {/* Node circle button */}
                                        <button
                                            className={`wsp-map-node${isDone ? ' wsp-map-node--done' : isInProgress ? ' wsp-map-node--progress' : ''}`}
                                            style={{ '--dc': meta?.color ?? '#64748b', '--dbg': meta?.bg ?? 'linear-gradient(135deg,#475569,#334155)' }}
                                            onClick={() => navigate(
                                                isDone
                                                    ? `/student/siswa/${studentId}/topics/${topicId}/dates/${date}/review`
                                                    : `/student/siswa/${studentId}/topics/${topicId}/dates/${date}/quiz`
                                            )}
                                        >
                                            <span className="wsp-map-node-lv">Level {idx + 1}</span>
                                            <span className="wsp-map-node-emoji">{isDone ? '✅' : isInProgress ? '🔄' : (meta?.emoji ?? '📅')}</span>
                                        </button>
                                        {/* Completion badge */}
                                        {isDone && <span className="wsp-node-badge wsp-node-badge--done">Tinjau Ulang</span>}
                                        {isInProgress && (
                                            <span className="wsp-node-badge wsp-node-badge--progress">
                                                {prog.pct}% selesai
                                            </span>
                                        )}
                                        {!isDone && !isInProgress && (
                                            <span className="wsp-node-badge wsp-node-badge--todo">Kerjakan!</span>
                                        )}

                                        {/* Info label (opposite side of node) */}
                                        <div
                                            className="wsp-map-label"
                                            style={isLeft
                                                ? { left: NODE_SZ + 14, textAlign: 'left' }
                                                : { right: NODE_SZ + 14, textAlign: 'right' }}
                                        >
                                            <span className="wsp-map-label-day" style={{ color: meta?.color ?? '#94a3b8' }}>
                                                {meta?.label ?? 'Hari'}
                                            </span>
                                            <span className="wsp-map-label-date">{dayNum} {month} {year}</span>
                                            <span className="wsp-map-label-count">{count} soal</span>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* 🏆 End marker */}
                            {dateGroups.length > 1 && (
                                <span className="wsp-map-marker wsp-map-marker--end"
                                    style={{
                                        left: nX(dateGroups.length - 1) - 18,
                                        top: nY(dateGroups.length - 1) + NODE_R + 10,
                                    }}>

                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
