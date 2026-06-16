import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../utils/apiFetch'
import './DayStudentPage.css'

const DAY_ORDER = { SENIN: 1, SELASA: 2, RABU: 3, KAMIS: 4, JUMAT: 5, SABTU: 6, MINGGU: 7 }

const DAY_THEMES = {
    SENIN: { emoji: '☀️', label: 'Senin', bg: 'linear-gradient(135deg,#fbbf24,#f97316)', color: '#f59e0b', shadow: '#fcd34d', tagline: 'Semangat awal minggu!' },
    SELASA: { emoji: '🔥', label: 'Selasa', bg: 'linear-gradient(135deg,#f97316,#ef4444)', color: '#ef4444', shadow: '#f87171', tagline: 'Terus bakar semangatmu!' },
    RABU: { emoji: '🌿', label: 'Rabu', bg: 'linear-gradient(135deg,#34d399,#10b981)', color: '#10b981', shadow: '#6ee7b7', tagline: 'Tumbuh dan belajar!' },
    KAMIS: { emoji: '💧', label: 'Kamis', bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)', color: '#3b82f6', shadow: '#93c5fd', tagline: 'Mengalir seperti air!' },
    JUMAT: { emoji: '⭐', label: "Jum'at", bg: 'linear-gradient(135deg,#818cf8,#6366f1)', color: '#6366f1', shadow: '#a5b4fc', tagline: 'Hari penuh bintang!' },
    SABTU: { emoji: '🌈', label: 'Sabtu', bg: 'linear-gradient(135deg,#f472b6,#ec4899)', color: '#ec4899', shadow: '#f9a8d4', tagline: 'Warna-warni cerita!' },
    MINGGU: { emoji: '🎉', label: 'Minggu', bg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', color: '#8b5cf6', shadow: '#c4b5fd', tagline: 'Hari istimewa untukmu!' },
}

export default function DayStudentPage() {
    const { studentId, topicId, weekId } = useParams()
    const navigate = useNavigate()

    const [topic, setTopic] = useState(null)
    const [week, setWeek] = useState(null)
    const [dayList, setDayList] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const [topicData, weeksData, daysData] = await Promise.all([
                apiFetch(`/topics/${topicId}`),
                apiFetch(`/topics/${topicId}/weeks`),
                apiFetch(`/weeks/${weekId}/days`),
            ])
            setTopic(topicData)
            const found = (Array.isArray(weeksData) ? weeksData : []).find((w) => String(w.id) === String(weekId))
            setWeek(found ?? null)
            const sorted = (Array.isArray(daysData) ? daysData : []).sort(
                (a, b) => (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99)
            )
            setDayList(sorted)
        } catch (err) { setError(err.message) }
        finally { setLoading(false) }
    }, [topicId, weekId])

    useEffect(() => { fetchData() }, [fetchData])

    return (
        <div className="dsp-wrapper">
            {/* Cloud decorations */}
            <div className="dsp-cloud dsp-cloud--1" />
            <div className="dsp-cloud dsp-cloud--2" />
            <div className="dsp-cloud dsp-cloud--3" />

            <div className="dsp-container">
                {/* Header */}
                <header className="dsp-header">
                    <button
                        className="dsp-back-btn"
                        onClick={() => navigate(`/student/siswa/${studentId}/topics/${topicId}/weeks`)}
                    >
                        ← Kembali
                    </button>
                    <div className="dsp-breadcrumb">
                        <span className="dsp-breadcrumb-topic">{topic?.nameTopic ?? '...'}</span>
                        <span className="dsp-breadcrumb-sep"> › </span>
                        <span className="dsp-breadcrumb-week">{week?.label ?? '...'}</span>
                    </div>
                </header>

                {/* Hero */}
                <div className="dsp-hero">
                    <div className="dsp-hero-emoji">📅</div>
                    <h1 className="dsp-title">Pilih Tantanganmu!</h1>
                    <p className="dsp-subtitle">Klik hari yang ingin kamu kerjakan sekarang 🎮</p>
                </div>

                {error && <p className="dsp-error">{error}</p>}

                {loading ? (
                    <div className="dsp-loading-wrap">
                        <div className="dsp-spinner" />
                        <p className="dsp-loading-text">Memuat hari...</p>
                    </div>
                ) : dayList.length === 0 ? (
                    <div className="dsp-empty">
                        <span className="dsp-empty-icon">😴</span>
                        <p>Belum ada hari untuk minggu ini.</p>
                    </div>
                ) : (
                    <div className="dsp-grid">
                        {dayList.map((day) => {
                            const theme = DAY_THEMES[day.dayOfWeek] ?? {
                                emoji: '📖', label: day.dayOfWeek, bg: 'linear-gradient(135deg,#64748b,#475569)',
                                color: '#64748b', shadow: '#94a3b8', tagline: 'Ayo belajar!',
                            }
                            return (
                                <button
                                    key={day.id}
                                    className="dsp-card"
                                    style={{ '--dcard-color': theme.color, '--dcard-shadow': theme.shadow }}
                                    onClick={() => navigate(`/student/siswa/${studentId}/topics/${topicId}/weeks/${weekId}/days/${day.id}/quiz`)}
                                >
                                    <div className="dsp-card-banner" style={{ background: theme.bg }}>
                                        <span className="dsp-day-emoji">{theme.emoji}</span>
                                    </div>
                                    <div className="dsp-card-body">
                                        <p className="dsp-day-name">{theme.label}</p>
                                        <p className="dsp-day-tagline">{theme.tagline}</p>
                                        <div className="dsp-play-btn">
                                            <span>▶ Mulai</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
