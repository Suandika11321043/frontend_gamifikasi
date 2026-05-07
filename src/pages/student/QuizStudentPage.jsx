import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './QuizStudentPage.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.')
    return data
}

// ── QUIZ: Multiple choice ─────────────────────────────────────────
function QuizQuestion({ question, answer, onAnswer }) {
    return (
        <div className="question-card__options">
            {question.options.map((opt) => {
                const selected = answer === opt.optionId
                return (
                    <button
                        key={opt.optionId}
                        className={`option-btn ${selected ? 'option-btn--selected' : ''} ${opt.mediaOpsi ? 'option-btn--has-img' : ''}`}
                        onClick={() => onAnswer(question.questionId, opt.optionId)}
                    >
                        {opt.mediaOpsi && (
                            <img src={opt.mediaOpsi} alt={opt.teksOpsi} className="option-btn__img" />
                        )}
                        <span className="option-btn__dot" />
                        <span>{opt.teksOpsi}</span>
                    </button>
                )
            })}
        </div>
    )
}

// ── MATCH: Cocokkan pasangan ──────────────────────────────────────
function MatchQuestion({ question, answer, onAnswer }) {
    const pertanyaan = question.options.filter((o) => o.tipeItem === 'PERTANYAAN')
    const jawaban = question.options.filter((o) => o.tipeItem === 'JAWABAN')
    const matchAnswer = answer || {}
    const [selectedPId, setSelectedPId] = useState(null)

    const handlePClick = (pId) => {
        setSelectedPId((prev) => (prev === pId ? null : pId))
    }

    const handleJClick = (jId) => {
        if (!selectedPId) return
        const newMatch = { ...matchAnswer }
        // Remove any other pertanyaan already matched to this jawaban
        Object.keys(newMatch).forEach((k) => { if (newMatch[k] === jId) delete newMatch[k] })
        newMatch[selectedPId] = jId
        setSelectedPId(null)
        onAnswer(question.questionId, newMatch)
    }

    const removeMatch = (pId, e) => {
        e.stopPropagation()
        const newMatch = { ...matchAnswer }
        delete newMatch[pId]
        onAnswer(question.questionId, Object.keys(newMatch).length > 0 ? newMatch : undefined)
    }

    const usedJIds = Object.values(matchAnswer)

    if (pertanyaan.length === 0 || jawaban.length === 0) {
        return <p className="quiz-empty-type">Data soal tidak lengkap.</p>
    }

    return (
        <div className="match-container">
            {selectedPId && (
                <p className="match-hint">
                    Pilih jawaban untuk: <strong>{pertanyaan.find((p) => p.optionId === selectedPId)?.teksOpsi}</strong>
                </p>
            )}
            <div className="match-columns">
                {/* Pertanyaan column */}
                <div className="match-column">
                    <p className="match-col-title">Pertanyaan</p>
                    {pertanyaan.map((p) => {
                        const isSelected = selectedPId === p.optionId
                        const isMatched = matchAnswer[p.optionId] !== undefined
                        const pairedJ = jawaban.find((j) => j.optionId === matchAnswer[p.optionId])
                        return (
                            <button
                                key={p.optionId}
                                className={`match-item ${isSelected ? 'match-item--active' : ''} ${isMatched ? 'match-item--matched' : ''}`}
                                onClick={() => handlePClick(p.optionId)}
                            >
                                {p.mediaOpsi && (
                                    <img src={p.mediaOpsi} alt={p.teksOpsi} className="match-item__img" />
                                )}
                                <span className="match-item__text">{p.teksOpsi}</span>
                                {isMatched && (
                                    <span className="match-item__pair">
                                        → {pairedJ?.teksOpsi}
                                        <span role="button" tabIndex={0} className="match-remove-btn" onClick={(e) => removeMatch(p.optionId, e)} onKeyDown={(e) => e.key === 'Enter' && removeMatch(p.optionId, e)}>✕</span>
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="match-divider-col">
                    <div className="match-vs">↔</div>
                </div>

                {/* Jawaban column */}
                <div className="match-column">
                    <p className="match-col-title">Jawaban</p>
                    {jawaban.map((j) => {
                        const isUsed = usedJIds.includes(j.optionId)
                        const isTarget = !!selectedPId && !isUsed
                        return (
                            <button
                                key={j.optionId}
                                className={`match-item match-item--answer ${isUsed ? 'match-item--used' : ''} ${isTarget ? 'match-item--target' : ''}`}
                                onClick={() => handleJClick(j.optionId)}
                                disabled={isUsed}
                            >
                                {j.mediaOpsi && (
                                    <img src={j.mediaOpsi} alt={j.teksOpsi} className="match-item__img" />
                                )}
                                <span className="match-item__text">{j.teksOpsi}</span>
                                {isUsed && <span className="match-item__check">✓</span>}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ── SORTING: Urutkan item ─────────────────────────────────────────
function SortingQuestion({ question, answer, onAnswer }) {
    const [order, setOrder] = useState(() => answer || question.options.map((o) => o.optionId))
    const [draggingIdx, setDraggingIdx] = useState(null)
    const optionMap = Object.fromEntries(question.options.map((o) => [o.optionId, o]))

    const handleDragStart = (e, idx) => {
        setDraggingIdx(idx)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e, idx) => {
        e.preventDefault()
        if (draggingIdx === null || draggingIdx === idx) return
        const newOrder = [...order]
        const [moved] = newOrder.splice(draggingIdx, 1)
        newOrder.splice(idx, 0, moved)
        setDraggingIdx(idx)
        setOrder(newOrder)
    }

    const handleDragEnd = () => {
        setDraggingIdx(null)
        onAnswer(question.questionId, order)
    }

    const moveItem = (idx, dir) => {
        const newIdx = idx + dir
        if (newIdx < 0 || newIdx >= order.length) return
        const newOrder = [...order]
            ;[newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]]
        setOrder(newOrder)
        onAnswer(question.questionId, newOrder)
    }

    return (
        <div className="sorting-container">
            <p className="sorting-hint">Seret atau gunakan ↑↓ untuk mengurutkan</p>
            {order.map((optId, idx) => (
                <div
                    key={optId}
                    className={`sort-item ${draggingIdx === idx ? 'sort-item--dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                >
                    <span className="sort-item__num">{idx + 1}</span>
                    <span className="sort-item__handle">⠿</span>
                    {optionMap[optId]?.mediaOpsi && (
                        <img src={optionMap[optId].mediaOpsi} alt={optionMap[optId].teksOpsi} className="sort-item__img" />
                    )}
                    <span className="sort-item__text">{optionMap[optId]?.teksOpsi}</span>
                    <div className="sort-item__arrows">
                        <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} aria-label="Pindah ke atas">↑</button>
                        <button onClick={() => moveItem(idx, 1)} disabled={idx === order.length - 1} aria-label="Pindah ke bawah">↓</button>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── DRAG AND DROP: Seret ke kotak (multi-item per zone) ──────────
function DragAndDropQuestion({ question, answer, onAnswer }) {
    const items = question.options.filter((o) => o.tipeItem === 'JAWABAN')
    const targets = question.options.filter((o) => o.tipeItem === 'PERTANYAAN')
    // dropAnswer: { [targetId]: optionId[] }
    const dropAnswer = answer || {}
    const [draggedId, setDraggedId] = useState(null)

    if (question.options.length === 0) {
        return <p className="quiz-empty-type">Belum ada pilihan untuk soal ini.</p>
    }

    // Flat list of all placed item IDs across all zones
    const usedItemIds = Object.values(dropAnswer).flat()

    const handleDrop = (e, targetId) => {
        e.preventDefault()
        if (!draggedId) return
        const newAnswer = { ...dropAnswer }
        // Remove draggedId from whichever zone currently has it
        Object.keys(newAnswer).forEach((k) => {
            if (Array.isArray(newAnswer[k])) {
                newAnswer[k] = newAnswer[k].filter((id) => id !== draggedId)
                if (newAnswer[k].length === 0) delete newAnswer[k]
            }
        })
        // Add to target zone
        newAnswer[targetId] = [...(newAnswer[targetId] || []), draggedId]
        setDraggedId(null)
        onAnswer(question.questionId, newAnswer)
    }

    const removeDropped = (targetId, itemId, e) => {
        e.stopPropagation()
        const newAnswer = { ...dropAnswer }
        newAnswer[targetId] = (newAnswer[targetId] || []).filter((id) => id !== itemId)
        if (newAnswer[targetId].length === 0) delete newAnswer[targetId]
        onAnswer(question.questionId, Object.keys(newAnswer).length > 0 ? newAnswer : undefined)
    }

    return (
        <div className="dnd-container">
            <p className="sorting-hint">Seret item ke kotak yang sesuai (boleh lebih dari satu)</p>

            {/* Available items — items already placed are hidden */}
            <div className="dnd-items">
                {items
                    .filter((i) => !usedItemIds.includes(i.optionId))
                    .map((item) => (
                        <div
                            key={item.optionId}
                            className={`dnd-chip ${draggedId === item.optionId ? 'dnd-chip--dragging' : ''} ${item.mediaOpsi ? 'dnd-chip--has-img' : ''}`}
                            draggable
                            onDragStart={() => setDraggedId(item.optionId)}
                            onDragEnd={() => setDraggedId(null)}
                        >
                            {item.mediaOpsi && (
                                <img src={item.mediaOpsi} alt={item.teksOpsi} className="dnd-chip__img" />
                            )}
                            <span>{item.teksOpsi}</span>
                        </div>
                    ))}
                {items.filter((i) => !usedItemIds.includes(i.optionId)).length === 0 && (
                    <p className="dnd-all-placed">Semua item sudah ditempatkan</p>
                )}
            </div>

            {/* Drop targets */}
            <div className="dnd-targets">
                {targets.map((target) => {
                    const droppedIds = dropAnswer[target.optionId] || []
                    const hasItems = droppedIds.length > 0
                    return (
                        <div key={target.optionId} className="dnd-target-group">
                            <div className="dnd-target-header">
                                {target.mediaOpsi && (
                                    <img src={target.mediaOpsi} alt={target.teksOpsi} className="dnd-target-img" />
                                )}
                                <p className="dnd-target-label">{target.teksOpsi}</p>
                            </div>
                            <div
                                className={`dnd-drop-zone ${hasItems ? 'dnd-drop-zone--filled' : ''} ${draggedId ? 'dnd-drop-zone--hover' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, target.optionId)}
                            >
                                {hasItems ? (
                                    <div className="dnd-drop-zone__chips">
                                        {droppedIds.map((dId) => {
                                            const dItem = items.find((i) => i.optionId === dId)
                                            if (!dItem) return null
                                            return (
                                                <div
                                                    key={dId}
                                                    className={`dnd-chip dnd-chip--placed ${dItem.mediaOpsi ? 'dnd-chip--has-img' : ''}`}
                                                >
                                                    {dItem.mediaOpsi && (
                                                        <img src={dItem.mediaOpsi} alt={dItem.teksOpsi} className="dnd-chip__img" />
                                                    )}
                                                    <span>{dItem.teksOpsi}</span>
                                                    <button
                                                        className="dnd-remove-btn"
                                                        onClick={(e) => removeDropped(target.optionId, dId, e)}
                                                    >✕</button>
                                                </div>
                                            )
                                        })}
                                        <span className="dnd-drop-hint dnd-drop-hint--more">+ Tambah</span>
                                    </div>
                                ) : (
                                    <span className="dnd-drop-hint">Taruh di sini</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Type badge ────────────────────────────────────────────────────
const TYPE_LABELS = {
    QUIZ: { label: 'Pilihan Ganda', icon: '🅰', color: 'badge--quiz' },
    MATCH: { label: 'Cocokkan', icon: '🔗', color: 'badge--match' },
    SORTING: { label: 'Urutkan', icon: '↕', color: 'badge--sort' },
    DRAG_AND_DROP: { label: 'Seret & Lepas', icon: '✋', color: 'badge--dnd' },
}

function TypeBadge({ type }) {
    const meta = TYPE_LABELS[type] || { label: type, icon: '❓', color: '' }
    return (
        <span className={`question-type-badge ${meta.color}`}>
            {meta.icon} {meta.label}
        </span>
    )
}

// ── Helpers ───────────────────────────────────────────────────────
function isAnswered(q, answers) {
    const a = answers[q.questionId]
    if (a === undefined || a === null) return false
    switch (q.questionType) {
        case 'QUIZ':
            return typeof a === 'number'
        case 'MATCH': {
            const pertanyaan = q.options.filter((o) => o.tipeItem === 'PERTANYAAN')
            if (pertanyaan.length === 0) return false
            return pertanyaan.every((p) => a[p.optionId] !== undefined)
        }
        case 'SORTING':
            return Array.isArray(a) && a.length > 0
        case 'DRAG_AND_DROP': {
            const targets = q.options.filter((o) => o.tipeItem === 'PERTANYAAN')
            if (targets.length === 0) return true
            return targets.every((t) => Array.isArray(a[t.optionId]) && a[t.optionId].length > 0)
        }
        default:
            return !!a
    }
}

// ── Main Page ─────────────────────────────────────────────────────
function QuizStudentPage() {
    const { studentId, topicId } = useParams()
    const navigate = useNavigate()

    const [questions, setQuestions] = useState([])
    const [topicName, setTopicName] = useState('')
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [answers, setAnswers] = useState({})
    const [phase, setPhase] = useState('quiz')
    const [result, setResult] = useState(null)
    const [submitError, setSubmitError] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const [topicData, questionData] = await Promise.all([
                apiFetch(`/topics/${topicId}`),
                apiFetch(`/quiz/topics/${topicId}/questions`),
            ])
            setTopicName(topicData.nameTopic ?? `Topik ${topicId}`)
            setQuestions(Array.isArray(questionData) ? questionData : [])
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [topicId])

    useEffect(() => { fetchData() }, [fetchData])

    // Auto-initialize SORTING answers with default order when questions load
    useEffect(() => {
        if (questions.length === 0) return
        setAnswers((prev) => {
            const next = { ...prev }
            questions.forEach((q) => {
                if (q.questionType === 'SORTING' && !next[q.questionId]) {
                    next[q.questionId] = q.options.map((o) => o.optionId)
                }
            })
            return next
        })
    }, [questions])

    const handleAnswer = (questionId, value) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }))
    }

    const answeredCount = questions.filter((q) => isAnswered(q, answers)).length
    const allAnswered = questions.length > 0 && answeredCount === questions.length

    const handleSubmit = async () => {
        if (!allAnswered) return
        setPhase('submitting')
        setSubmitError('')
        try {
            const payload = {
                studentId: Number(studentId),
                topicId: Number(topicId),
                answers: questions.map((q) => {
                    const a = answers[q.questionId]
                    const base = { questionId: q.questionId }

                    // QUIZ → selectedOptionIds: [optionId]
                    if (q.questionType === 'QUIZ') {
                        return { ...base, selectedOptionIds: [a] }
                    }

                    // MATCH → matchingPairs: { pertanyaanId(Long): jawabanId(Long) }
                    if (q.questionType === 'MATCH') {
                        const matchingPairs = {}
                        Object.entries(a || {}).forEach(([pId, jId]) => {
                            matchingPairs[Number(pId)] = jId
                        })
                        return { ...base, matchingPairs }
                    }

                    // SORTING → orderedOptionIds: [id, id, ...]
                    if (q.questionType === 'SORTING') {
                        return { ...base, orderedOptionIds: a || [] }
                    }

                    // DRAG_AND_DROP → matchingPairs: { targetId: [itemId, ...] }
                    if (q.questionType === 'DRAG_AND_DROP') {
                        const matchingPairs = {}
                        Object.entries(a || {}).forEach(([tId, iIds]) => {
                            const ids = Array.isArray(iIds) ? iIds : [iIds]
                            if (ids.length > 0) matchingPairs[Number(tId)] = ids
                        })
                        return { ...base, matchingPairs }
                    }

                    return base
                }),
            }
            const data = await apiFetch('/quiz/submit', {
                method: 'POST',
                body: JSON.stringify(payload),
            })
            setResult(data)
            setPhase('result')
        } catch (err) {
            setSubmitError(err.message)
            setPhase('quiz')
        }
    }

    // ── Loading ───────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="quiz-wrapper">
                <div className="quiz-decoration quiz-decoration--1" />
                <div className="quiz-decoration quiz-decoration--2" />
                <p className="quiz-loading">Memuat soal...</p>
            </div>
        )
    }

    // ── Error ─────────────────────────────────────────────────────
    if (fetchError) {
        return (
            <div className="quiz-wrapper">
                <div className="quiz-decoration quiz-decoration--1" />
                <div className="quiz-decoration quiz-decoration--2" />
                <div className="quiz-container">
                    <button className="quiz-back-btn" onClick={() => navigate(-1)}>← Kembali</button>
                    <p className="quiz-fetch-error">{fetchError}</p>
                </div>
            </div>
        )
    }

    // ── Result screen ─────────────────────────────────────────────
    if (phase === 'result' && result) {
        const correct = result.correctCount ?? 0
        const total = result.totalQuestions ?? questions.length
        const pct = total > 0 ? Math.round((correct / total) * 100) : 0
        const stars = result.starsEarned ?? 0
        const totalStars = result.totalStars ?? 0
        const rankName = result.rankName ?? ''
        const details = result.answerDetails ?? []
        const totalScore = details.reduce((sum, d) => sum + (d.earnedScore ?? 0), 0)

        const rankLabels = { BEGINNER: 'Pemula', INTERMEDIATE: 'Menengah', ADVANCED: 'Mahir', EXPERT: 'Ahli' }

        return (
            <div className="quiz-wrapper">
                <div className="quiz-decoration quiz-decoration--1" />
                <div className="quiz-decoration quiz-decoration--2" />
                <div className="quiz-container quiz-container--result">

                    {/* Score circle */}
                    <div className="result-circle" style={{ '--pct': `${pct}%` }}>
                        <span className="result-circle__score">{pct}%</span>
                        <span className="result-circle__label">Skor</span>
                    </div>

                    {/* Stars */}
                    <div className="result-stars">
                        {[1, 2, 3].map((s) => (
                            <span key={s} className={`result-star ${s <= stars ? 'result-star--filled' : ''}`}>★</span>
                        ))}
                    </div>

                    <h2 className="result-title">
                        {pct >= 80 ? '🎉 Luar Biasa!' : pct >= 60 ? '👍 Bagus!' : pct >= 40 ? '💪 Terus Semangat!' : '📚 Ayo Coba Lagi!'}
                    </h2>

                    {/* Stats row */}
                    <div className="result-stats">
                        <div className="result-stat">
                            <span className="result-stat__val">{correct}</span>
                            <span className="result-stat__lbl">Benar</span>
                        </div>
                        <div className="result-stat">
                            <span className="result-stat__val">{total - correct}</span>
                            <span className="result-stat__lbl">Salah</span>
                        </div>
                        <div className="result-stat">
                            <span className="result-stat__val result-stat__val--points">+{totalScore}</span>
                            <span className="result-stat__lbl">Total Skor</span>
                        </div>
                        <div className="result-stat">
                            <span className="result-stat__val result-stat__val--stars">⭐ {totalStars}</span>
                            <span className="result-stat__lbl">Total Bintang</span>
                        </div>
                    </div>

                    {/* Rank badge */}
                    {rankName && (
                        <div className="result-rank-badge">
                            🏅 Rank: <strong>{rankLabels[rankName] ?? rankName}</strong>
                        </div>
                    )}

                    {/* Per-question answer details */}
                    {details.length > 0 && (
                        <div className="result-details">
                            <p className="result-details__title">Rincian Jawaban</p>
                            {details.map((d, idx) => (
                                <div key={d.questionId} className={`result-detail-row ${d.correct ? 'result-detail-row--correct' : 'result-detail-row--wrong'}`}>
                                    <span className="result-detail-num">Soal {idx + 1}</span>
                                    <span className="result-detail-icon">{d.correct ? '✓' : '✗'}</span>
                                    <span className="result-detail-score">+{d.earnedScore ?? 0}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="result-actions">
                        <button
                            className="quiz-btn quiz-btn--outline"
                            onClick={() => navigate(`/student/siswa/${studentId}/topics`)}
                        >
                            Pilih Topik Lain
                        </button>
                        <button
                            className="quiz-btn quiz-btn--primary"
                            onClick={() => { setAnswers({}); setResult(null); setPhase('quiz') }}
                        >
                            Ulangi Kuis
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Quiz screen ───────────────────────────────────────────────
    return (
        <div className="quiz-wrapper">
            <div className="quiz-decoration quiz-decoration--1" />
            <div className="quiz-decoration quiz-decoration--2" />

            <div className="quiz-container">
                {/* Header */}
                <header className="quiz-header">
                    <button className="quiz-back-btn" onClick={() => navigate(-1)}>← Kembali</button>
                    <div className="quiz-header__meta">
                        <span className="quiz-topic-badge">📚 {topicName}</span>
                        <span className="quiz-progress">{answeredCount}/{questions.length} dijawab</span>
                    </div>
                </header>

                <h2 className="quiz-title">Kerjakan Soal</h2>

                {/* Progress bar */}
                <div className="quiz-progress-bar">
                    <div
                        className="quiz-progress-bar__fill"
                        style={{ width: questions.length ? `${(answeredCount / questions.length) * 100}%` : '0%' }}
                    />
                </div>

                {submitError && <p className="quiz-submit-error">{submitError}</p>}

                {questions.length === 0 ? (
                    <p className="quiz-empty">Tidak ada soal pada topik ini.</p>
                ) : (
                    <div className="quiz-questions">
                        {questions.map((q, idx) => {
                            const answered = isAnswered(q, answers)
                            return (
                                <div className={`question-card ${answered ? 'question-card--answered' : ''}`} key={q.questionId}>
                                    <div className="question-card__header">
                                        <p className="question-card__num">Soal {idx + 1}</p>
                                        <TypeBadge type={q.questionType} />
                                    </div>
                                    <p className="question-card__text">{q.contentInstruction}</p>
                                    {q.contentImage && (
                                        <img src={q.contentImage} alt="Gambar soal" className="question-card__img" />
                                    )}

                                    {q.questionType === 'QUIZ' && (
                                        <QuizQuestion
                                            question={q}
                                            answer={answers[q.questionId]}
                                            onAnswer={handleAnswer}
                                        />
                                    )}
                                    {q.questionType === 'MATCH' && (
                                        <MatchQuestion
                                            question={q}
                                            answer={answers[q.questionId]}
                                            onAnswer={handleAnswer}
                                        />
                                    )}
                                    {q.questionType === 'SORTING' && (
                                        <SortingQuestion
                                            question={q}
                                            answer={answers[q.questionId]}
                                            onAnswer={handleAnswer}
                                        />
                                    )}
                                    {q.questionType === 'DRAG_AND_DROP' && (
                                        <DragAndDropQuestion
                                            question={q}
                                            answer={answers[q.questionId]}
                                            onAnswer={handleAnswer}
                                        />
                                    )}

                                    {answered && (
                                        <p className="question-card__done">✓ Terjawab</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Submit */}
                {questions.length > 0 && (
                    <div className="quiz-footer">
                        <button
                            className={`quiz-btn quiz-btn--primary quiz-btn--lg ${!allAnswered ? 'quiz-btn--disabled' : ''}`}
                            onClick={handleSubmit}
                            disabled={!allAnswered || phase === 'submitting'}
                        >
                            {phase === 'submitting' ? 'Mengirim...' : `Kumpulkan Jawaban (${answeredCount}/${questions.length})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default QuizStudentPage
