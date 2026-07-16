import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Map, Flag, Trophy, Check, Play, RotateCcw } from 'lucide-react'
import { apiFetch } from '../../utils/apiFetch'
import TopicIcon from '../../components/common/TopicIcon'
import StarsDisplay from '../../components/common/StarsDisplay'
import './WeekStudentPage.css'

const JSDAY_META = {
    1: { label: 'Senin', color: '#d97706', bg: 'linear-gradient(145deg,#fde68a,#f59e0b)' },
    2: { label: 'Selasa', color: '#dc2626', bg: 'linear-gradient(145deg,#fecaca,#ef4444)' },
    3: { label: 'Rabu', color: '#059669', bg: 'linear-gradient(145deg,#a7f3d0,#10b981)' },
    4: { label: 'Kamis', color: '#2563eb', bg: 'linear-gradient(145deg,#bfdbfe,#3b82f6)' },
    5: { label: "Jum'at", color: '#7c3aed', bg: 'linear-gradient(145deg,#ddd6fe,#8b5cf6)' },
}

const MONTH_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatDate(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`)
    const jsDay = d.getDay()
    return {
        meta: JSDAY_META[jsDay],
        dayNum: d.getDate(),
        month: MONTH_NAMES[d.getMonth() + 1],
        year: d.getFullYear(),
    }
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
        setLoading(true)
        setError('')
        try {
            const [topicData, grouped] = await Promise.all([
                apiFetch(`/topics/${topicId}`),
                apiFetch(`/questions/topic/${topicId}/student/${studentId}`).catch(() => []),
            ])
            setTopic(topicData)
            const groupList = Array.isArray(grouped) ? grouped : (grouped?.data ?? [])

            const completed = new Set()
            const progress = {}
            groupList.forEach(({ learningDate, isAvailable, questions }) => {
                if (isAvailable !== true) return
                const qList = Array.isArray(questions) ? questions : []
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
                    .filter((g) => g.isAvailable === true && g.learningDate)
                    .sort((a, b) => a.learningDate.localeCompare(b.learningDate))
                    .map(({ learningDate, questions, starCount }) => ({
                        date: learningDate,
                        count: (questions ?? []).length,
                        stars: starCount ?? (questions ?? []).filter((q) => q.correct === true).length,
                    }))
                    .filter((g) => g.count > 0)
            )
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [topicId, studentId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const doneCount = dateGroups.filter((g) => completedDates.has(g.date)).length

    return (
        <div className="wsp-wrapper">
            <div className="wsp-sky" aria-hidden="true" />
            <div className="wsp-sun" aria-hidden="true" />
            <div className="wsp-cloud wsp-cloud--1" aria-hidden="true" />
            <div className="wsp-cloud wsp-cloud--2" aria-hidden="true" />
            <div className="wsp-cloud wsp-cloud--3" aria-hidden="true" />
            <div className="wsp-hill wsp-hill--left" aria-hidden="true" />
            <div className="wsp-hill wsp-hill--right" aria-hidden="true" />
            <div className="wsp-grass" aria-hidden="true" />

            <div className="wsp-container">
                <header className="wsp-header">
                    <button
                        type="button"
                        className="wsp-back-btn"
                        onClick={() => navigate(`/student/siswa/${studentId}/topics`)}
                    >
                        ← Kembali
                    </button>
                    <div className="wsp-topic-badge">
                        <TopicIcon
                            icon={topic?.icon}
                            name={topic?.nameTopic}
                            className="wsp-topic-icon"
                            placeholderClassName="wsp-topic-icon-ph"
                        />
                        <span>{topic?.nameTopic ?? '...'}</span>
                    </div>
                </header>

                <div className="wsp-hero">
                    <div className="wsp-hero-icon" aria-hidden="true">
                        <Map size={36} strokeWidth={2.4} />
                    </div>
                    <h1 className="wsp-title">Peta Belajar</h1>
                    <p className="wsp-subtitle">Ikuti jalan, ketuk level untuk bermain!</p>
                    {!loading && dateGroups.length > 0 && (
                        <p className="wsp-progress-chip">
                            <Trophy size={14} strokeWidth={2.5} aria-hidden="true" />
                            {doneCount} / {dateGroups.length} level selesai
                        </p>
                    )}
                </div>

                {error && <p className="wsp-error">{error}</p>}

                {loading ? (
                    <div className="wsp-loading-wrap">
                        <div className="wsp-spinner" />
                        <p className="wsp-loading-text">Memuat peta...</p>
                    </div>
                ) : dateGroups.length === 0 ? (
                    <div className="wsp-empty">
                        <span className="wsp-empty-icon" aria-hidden="true">📭</span>
                        <p>Belum ada soal untuk tema ini.</p>
                    </div>
                ) : (
                    <div className="wsp-map-board">
                        <div className="wsp-trail">
                            <div className="wsp-trail-start" aria-hidden="true">
                                <span className="wsp-trail-pin wsp-trail-pin--start">
                                    <Flag size={20} strokeWidth={2.5} />
                                </span>
                                <span className="wsp-trail-pin-text">Mulai</span>
                            </div>

                            {dateGroups.map(({ date, count, stars }, idx) => {
                                const { meta, dayNum, month, year } = formatDate(date)
                                const isDone = completedDates.has(date)
                                const prog = progressDates[date]
                                const isInProgress = !isDone && prog && prog.answered > 0
                                const side = idx % 2 === 0 ? 'left' : 'right'
                                const isLast = idx === dateGroups.length - 1

                                return (
                                    <div
                                        key={date}
                                        className={`wsp-step wsp-step--${side}`}
                                    >
                                        {!isLast && <div className="wsp-step-connector" aria-hidden="true" />}

                                        <button
                                            type="button"
                                            className={`wsp-step-card${isDone ? ' wsp-step-card--done' : ''}${isInProgress ? ' wsp-step-card--progress' : ''}`}
                                            style={{
                                                '--dc': meta?.color ?? '#64748b',
                                                '--dbg': meta?.bg ?? 'linear-gradient(145deg,#cbd5e1,#64748b)',
                                            }}
                                            onClick={() => navigate(
                                                isDone
                                                    ? `/student/siswa/${studentId}/topics/${topicId}/dates/${date}/review`
                                                    : `/student/siswa/${studentId}/topics/${topicId}/dates/${date}/quiz`
                                            )}
                                        >
                                            <span className="wsp-step-node" aria-hidden="true">
                                                <span className="wsp-step-lv">Lv {idx + 1}</span>
                                                <span className="wsp-step-icon">
                                                    {isDone ? (
                                                        <Check size={28} strokeWidth={3} />
                                                    ) : isInProgress ? (
                                                        <RotateCcw size={24} strokeWidth={2.6} />
                                                    ) : (
                                                        <Play size={26} strokeWidth={2.6} fill="currentColor" />
                                                    )}
                                                </span>
                                            </span>

                                            <span className="wsp-step-info">
                                                <span className="wsp-step-day">{meta?.label ?? 'Hari'}</span>
                                                <span className="wsp-step-date">{dayNum} {month} {year}</span>
                                                <span className="wsp-step-meta">
                                                    <span className="wsp-step-count">{count} soal</span>
                                                    {isDone && (
                                                        <>
                                                            <span className="wsp-step-status wsp-step-status--done">Selesai</span>
                                                            <span className="wsp-step-status wsp-step-status--review">Tinjau Ulang</span>
                                                        </>
                                                    )}
                                                    {isInProgress && (
                                                        <span className="wsp-step-status wsp-step-status--progress">
                                                            {prog.pct}%
                                                        </span>
                                                    )}
                                                    {!isDone && !isInProgress && (
                                                        <span className="wsp-step-status wsp-step-status--todo">Main!</span>
                                                    )}
                                                </span>
                                                <StarsDisplay
                                                    count={stars}
                                                    className="wsp-step-stars"
                                                    textLabel="bintang hari ini"
                                                />
                                            </span>
                                        </button>
                                    </div>
                                )
                            })}

                            <div className="wsp-trail-end" aria-hidden="true">
                                <span className="wsp-trail-pin wsp-trail-pin--end">
                                    <Trophy size={20} strokeWidth={2.5} />
                                </span>
                                <span className="wsp-trail-pin-text">Selesai</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
