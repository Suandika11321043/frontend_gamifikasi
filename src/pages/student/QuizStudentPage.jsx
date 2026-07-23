import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { playCorrectSound, playWrongSound } from '../../utils/cursorSound.js'
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
    const allHaveImg = question.options.length > 0 && question.options.every((o) => !!o.mediaOpsi)
    return (
        <div className={`question-card__options${allHaveImg ? ' question-card__options--grid' : ''}`}>
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
                        {!allHaveImg && <span className="option-btn__dot" />}
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
            {/* Step guide */}
            <div className="match-steps">
                <div className={`match-step ${!selectedPId ? 'match-step--active' : 'match-step--done'}`}>
                    <span className="match-step__bubble">{!selectedPId ? '1' : '✓'}</span>
                    <span className="match-step__text">Ketuk pertanyaan</span>
                </div>
                <span className="match-steps__sep">→</span>
                <div className={`match-step ${selectedPId ? 'match-step--active' : ''}`}>
                    <span className="match-step__bubble">2</span>
                    <span className="match-step__text">Ketuk jawaban</span>
                </div>
            </div>

            {/* Selection hint */}
            {selectedPId && (
                <div className="match-hint">
                    👆 Pilih jawaban untuk: <strong>{pertanyaan.find((p) => p.optionId === selectedPId)?.teksOpsi}</strong>
                </div>
            )}

            <div className="match-columns">
                {/* Pertanyaan column */}
                <div className="match-column">
                    <p className="match-col-title">💬 Pertanyaan</p>
                    {pertanyaan.map((p, idx) => {
                        const isSelected = selectedPId === p.optionId
                        const isMatched = matchAnswer[p.optionId] !== undefined
                        const pairedJ = jawaban.find((j) => j.optionId === matchAnswer[p.optionId])
                        return (
                            <div className="match-item-wrapper" key={p.optionId}>
                                <button
                                    className={`match-item ${isSelected ? 'match-item--active' : ''} ${isMatched ? 'match-item--matched' : ''}`}
                                    onClick={() => handlePClick(p.optionId)}
                                >
                                    <span className="match-item__num">{idx + 1}</span>
                                    {p.mediaOpsi && (
                                        <img src={p.mediaOpsi} alt={p.teksOpsi} className="match-item__img" />
                                    )}
                                    <span className="match-item__text">{p.teksOpsi}</span>
                                    {isMatched && <span className="match-item__tick">✓</span>}
                                </button>
                                {isMatched && (
                                    <div className="match-pair-row">
                                        <span className="match-pair-arrow">↪</span>
                                        <span className="match-pair-label">{pairedJ?.teksOpsi}</span>
                                        <button
                                            className="match-remove-btn"
                                            onClick={(e) => removeMatch(p.optionId, e)}
                                            aria-label="Lepas pasangan"
                                        >✕</button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="match-divider-col">
                    <div className="match-vs">🔗</div>
                </div>

                {/* Jawaban column */}
                <div className="match-column">
                    <p className="match-col-title">✅ Jawaban</p>
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
    const hasTargetImgs = targets.some((t) => !!t.mediaOpsi)
    const dropAnswer = answer || {}
    const [draggedId, setDraggedId] = useState(null)
    const [selectedChipId, setSelectedChipId] = useState(null)

    if (question.options.length === 0) {
        return <p className="quiz-empty-type">Belum ada pilihan untuk soal ini.</p>
    }

    const usedItemIds = Object.values(dropAnswer).flat()

    const placeChip = (chipId, targetId) => {
        const newAnswer = { ...dropAnswer }
        Object.keys(newAnswer).forEach((k) => {
            if (Array.isArray(newAnswer[k])) {
                newAnswer[k] = newAnswer[k].filter((id) => id !== chipId)
                if (newAnswer[k].length === 0) delete newAnswer[k]
            }
        })
        newAnswer[targetId] = [...(newAnswer[targetId] || []), chipId]
        onAnswer(question.questionId, newAnswer)
    }

    const handleDrop = (e, targetId) => {
        e.preventDefault()
        if (!draggedId) return
        placeChip(draggedId, targetId)
        setDraggedId(null)
    }

    const handleChipTap = (itemId) => {
        setSelectedChipId((prev) => (prev === itemId ? null : itemId))
    }

    const handleZoneTap = (targetId) => {
        if (!selectedChipId) return
        placeChip(selectedChipId, targetId)
        setSelectedChipId(null)
    }

    const removeDropped = (targetId, itemId, e) => {
        e.stopPropagation()
        const newAnswer = { ...dropAnswer }
        newAnswer[targetId] = (newAnswer[targetId] || []).filter((id) => id !== itemId)
        if (newAnswer[targetId].length === 0) delete newAnswer[targetId]
        onAnswer(question.questionId, Object.keys(newAnswer).length > 0 ? newAnswer : undefined)
    }

    const isActive = !!draggedId || !!selectedChipId

    return (
        <div className={`dnd-container${hasTargetImgs ? ' dnd-has-target-imgs' : ''}`}>
            {/* Instruction bar */}
            <div className={`dnd-instruction ${selectedChipId ? 'dnd-instruction--picking' : ''}`}>
                <span className="dnd-instruction__icon">{selectedChipId ? '👉' : '✋'}</span>
                <span className="dnd-instruction__text">
                    {selectedChipId
                        ? <><strong>Ketuk kotak</strong> yang sesuai untuk kartu ini!</>
                        : <>Seret atau <strong>ketuk kartu</strong>, lalu taruh ke <strong>kotaknya</strong></>
                    }
                </span>
            </div>

            {/* Available chips */}
            <div className="dnd-items">
                {items
                    .filter((i) => !usedItemIds.includes(i.optionId))
                    .map((item) => (
                        <div
                            key={item.optionId}
                            className={`dnd-chip ${draggedId === item.optionId ? 'dnd-chip--dragging' : ''} ${selectedChipId === item.optionId ? 'dnd-chip--selected' : ''} ${item.mediaOpsi ? 'dnd-chip--has-img' : ''}`}
                            draggable
                            onDragStart={() => { setDraggedId(item.optionId); setSelectedChipId(null) }}
                            onDragEnd={() => setDraggedId(null)}
                            onClick={() => handleChipTap(item.optionId)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleChipTap(item.optionId)}
                        >
                            <span className="dnd-chip__handle">⠿</span>
                            {item.mediaOpsi && (
                                <img src={item.mediaOpsi} alt={item.teksOpsi} className="dnd-chip__img" />
                            )}
                            <span>{item.teksOpsi}</span>
                        </div>
                    ))}
                {items.filter((i) => !usedItemIds.includes(i.optionId)).length === 0 && (
                    <p className="dnd-all-placed">🎉 Semua kartu sudah ditempatkan!</p>
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
                                className={`dnd-drop-zone ${hasItems ? 'dnd-drop-zone--filled' : ''} ${isActive ? 'dnd-drop-zone--hover' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, target.optionId)}
                                onClick={() => handleZoneTap(target.optionId)}
                                role="button"
                                tabIndex={selectedChipId ? 0 : -1}
                                aria-label={`Kotak: ${target.teksOpsi}`}
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
                                                        aria-label="Hapus"
                                                    >✕</button>
                                                </div>
                                            )
                                        })}
                                        {isActive && (
                                            <span className="dnd-drop-hint dnd-drop-hint--more">+ Tambah</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="dnd-drop-hint">⬇ Taruh di sini</span>
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
    MATCH: { label: 'Mencocokkan', icon: '🔗', color: 'badge--match' },
    SORTING: { label: 'Mengurutkan', icon: '↕', color: 'badge--sort' },
    DRAG_AND_DROP: { label: 'Seret dan Letakkan', icon: '✋', color: 'badge--dnd' },
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
    const [topicIcon, setTopicIcon] = useState('')
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')

    // One-at-a-time state
    const [currentIdx, setCurrentIdx] = useState(0)
    const [currentAnswer, setCurrentAnswer] = useState(undefined)
    // phase: 'quiz' | 'submitting' | 'feedback' | 'finishing' | 'result'
    const [phase, setPhase] = useState('quiz')
    const [feedback, setFeedback] = useState(null)   // { questionId, correct, earnedScore }
    const [correctCount, setCorrectCount] = useState(0)
    const [totalScore, setTotalScore] = useState(0)
    const [answerHistory, setAnswerHistory] = useState([])
    const [submitError, setSubmitError] = useState('')
    const [result, setResult] = useState(null)

    // ── Fetch questions ───────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const [topicData, questionData] = await Promise.all([
                apiFetch(`/topics/${topicId}`),
                apiFetch(`/quiz/topics/${topicId}/questions`),
            ])
            setTopicName(topicData.nameTopic ?? `Tema ${topicId}`)
            setTopicIcon(topicData.icon ?? '')
            setQuestions(Array.isArray(questionData) ? questionData : [])
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [topicId])

    useEffect(() => { fetchData() }, [fetchData])

    // Auto-init SORTING answer when question changes
    const currentQuestion = questions[currentIdx]
    useEffect(() => {
        if (!currentQuestion) return
        if (currentQuestion.questionType === 'SORTING') {
            setCurrentAnswer(currentQuestion.options.map((o) => o.optionId))
        } else {
            setCurrentAnswer(undefined)
        }
    }, [currentIdx, currentQuestion?.questionId])

    const handleAnswer = (_questionId, value) => {
        setCurrentAnswer(value)
    }

    // Build per-question answer payload
    const buildAnswerPayload = (q, a) => {
        const base = { questionId: q.questionId }
        if (q.questionType === 'QUIZ') return { ...base, selectedOptionIds: [a] }
        if (q.questionType === 'MATCH') {
            const matchingPairs = {}
            Object.entries(a || {}).forEach(([pId, jId]) => { matchingPairs[Number(pId)] = jId })
            return { ...base, matchingPairs }
        }
        if (q.questionType === 'SORTING') return { ...base, orderedOptionIds: a || [] }
        if (q.questionType === 'DRAG_AND_DROP') {
            const matchingPairs = {}
            Object.entries(a || {}).forEach(([tId, iIds]) => {
                const ids = Array.isArray(iIds) ? iIds : [iIds]
                if (ids.length > 0) matchingPairs[Number(tId)] = ids
            })
            return { ...base, matchingPairs }
        }
        return base
    }

    const currentAnswered = currentQuestion
        ? isAnswered(currentQuestion, { [currentQuestion.questionId]: currentAnswer })
        : false

    // Submit single answer
    const handleSubmitAnswer = async () => {
        if (!currentAnswered) return
        setPhase('submitting')
        setSubmitError('')
        try {
            const data = await apiFetch('/quiz/submit/answer', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: Number(studentId),
                    topicId: Number(topicId),
                    answer: buildAnswerPayload(currentQuestion, currentAnswer),
                }),
            })
            const earned = data.earnedScore ?? 0
            const newCorrect = correctCount + (data.correct ? 1 : 0)
            const newTotal = totalScore + earned
            setCorrectCount(newCorrect)
            setTotalScore(newTotal)
            setAnswerHistory((h) => [...h, { questionId: data.questionId, correct: data.correct, earnedScore: earned }])
            if (data.correct) playCorrectSound()
            else playWrongSound()
            setFeedback(data)
            setPhase('feedback')
        } catch (err) {
            setSubmitError(err.message)
            setPhase('quiz')
        }
    }

    // Move to next question or finish
    const handleNext = async () => {
        const isLast = currentIdx === questions.length - 1
        if (!isLast) {
            setFeedback(null)
            setCurrentAnswer(undefined)
            setCurrentIdx((i) => i + 1)
            setPhase('quiz')
        } else {
            setPhase('finishing')
            setSubmitError('')
            try {
                const finishData = await apiFetch('/quiz/finish', {
                    method: 'POST',
                    body: JSON.stringify({
                        studentId: Number(studentId),
                        topicId: Number(topicId),
                        correctCount: correctCount + (feedback?.correct ? 0 : 0),
                        totalQuestions: questions.length,
                    }),
                })
                setResult(finishData)
                setPhase('result')
            } catch (err) {
                setSubmitError(err.message)
                setPhase('feedback')
            }
        }
    }

    const resetQuiz = () => {
        setCurrentIdx(0)
        setCurrentAnswer(undefined)
        setFeedback(null)
        setCorrectCount(0)
        setTotalScore(0)
        setAnswerHistory([])
        setResult(null)
        setSubmitError('')
        setPhase('quiz')
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

    // ── Finishing screen ──────────────────────────────────────────
    if (phase === 'finishing') {
        return (
            <div className="quiz-wrapper">
                <div className="quiz-decoration quiz-decoration--1" />
                <div className="quiz-decoration quiz-decoration--2" />
                <p className="quiz-loading">Menghitung hasil akhir...</p>
            </div>
        )
    }

    // ── Result screen ─────────────────────────────────────────────
    if (phase === 'result') {
        const correct = result?.correctCount ?? correctCount
        const total = result?.totalQuestions ?? questions.length
        const pct = total > 0 ? Math.round((correct / total) * 100) : 0
        const stars = result?.starsEarned ?? 0
        const finalTotalStars = result?.totalStars ?? 0

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
                        {finalTotalStars > 0 && (
                            <div className="result-stat">
                                <span className="result-stat__val result-stat__val--stars">⭐ {finalTotalStars}</span>
                                <span className="result-stat__lbl">Total Bintang</span>
                            </div>
                        )}
                    </div>

                    {/* Per-question answer details */}
                    {answerHistory.length > 0 && (
                        <div className="result-details">
                            <p className="result-details__title">Rincian Jawaban</p>
                            {answerHistory.map((d, idx) => (
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
                            Pilih Tema Lain
                        </button>
                        <button
                            className="quiz-btn quiz-btn--primary"
                            onClick={resetQuiz}
                        >
                            Ulangi Kuis
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Feedback screen (shown after each answer is submitted) ────
    if (phase === 'feedback' && feedback) {
        const isLast = currentIdx === questions.length - 1
        const isCorrect = feedback.correct
        const earned = feedback.earnedScore ?? 0

        return (
            <div className="quiz-wrapper">
                <div className="quiz-decoration quiz-decoration--1" />
                <div className="quiz-decoration quiz-decoration--2" />
                <div className="quiz-container">
                    {/* Header */}
                    <header className="quiz-header">
                        <button className="quiz-back-btn" onClick={() => navigate(-1)}>← Kembali</button>
                        <div className="quiz-header__meta">
                            <span className="quiz-topic-badge">
                                {topicIcon
                                    ? <img src={topicIcon} alt={topicName} className="quiz-topic-badge__icon" />
                                    : <span aria-hidden="true">📚</span>
                                }
                                {topicName}
                            </span>
                            <span className="quiz-progress">Soal {currentIdx + 1} / {questions.length}</span>
                        </div>
                    </header>

                    {/* Progress bar */}
                    <div className="quiz-progress-bar">
                        <div
                            className="quiz-progress-bar__fill"
                            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                        />
                    </div>

                    {/* Feedback card */}
                    <div className={`feedback-card ${isCorrect ? 'feedback-card--correct' : 'feedback-card--wrong'}`}>
                        <div className="feedback-icon">{isCorrect ? '✓' : '✗'}</div>
                        <h3 className="feedback-title">{isCorrect ? 'Jawaban Benar!' : 'Jawaban Salah'}</h3>
                        {isCorrect ? (
                            <p className="feedback-score">+{earned} poin</p>
                        ) : (
                            <p className="feedback-msg">Tetap semangat, terus berlatih!</p>
                        )}
                    </div>

                    {submitError && <p className="quiz-submit-error">{submitError}</p>}

                    <div className="quiz-footer">
                        <button
                            className="quiz-btn quiz-btn--primary quiz-btn--lg"
                            onClick={handleNext}
                            disabled={phase === 'finishing'}
                        >
                            {isLast ? 'Lihat Hasil' : 'Soal Berikutnya →'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Quiz screen (one question at a time) ──────────────────────
    return (
        <div className="quiz-wrapper">
            <div className="quiz-decoration quiz-decoration--1" />
            <div className="quiz-decoration quiz-decoration--2" />

            <div className="quiz-container">
                {/* Header */}
                <header className="quiz-header">
                    <button className="quiz-back-btn" onClick={() => navigate(-1)}>← Kembali</button>
                    <div className="quiz-header__meta">
                        <span className="quiz-topic-badge">
                            {topicIcon
                                ? <img src={topicIcon} alt={topicName} className="quiz-topic-badge__icon" />
                                : <span aria-hidden="true">📚</span>
                            }
                            {topicName}
                        </span>
                        <span className="quiz-progress">Soal {currentIdx + 1} / {questions.length}</span>
                    </div>
                </header>

                <h2 className="quiz-title">Kerjakan Soal</h2>

                {/* Progress bar */}
                <div className="quiz-progress-bar">
                    <div
                        className="quiz-progress-bar__fill"
                        style={{ width: questions.length ? `${(currentIdx / questions.length) * 100}%` : '0%' }}
                    />
                </div>

                {submitError && <p className="quiz-submit-error">{submitError}</p>}

                {questions.length === 0 ? (
                    <p className="quiz-empty">Tidak ada soal pada tema ini.</p>
                ) : currentQuestion ? (
                    <div className="question-card" key={currentQuestion.questionId}>
                        <div className="question-card__header">
                            <p className="question-card__num">Soal {currentIdx + 1}</p>
                            <TypeBadge type={currentQuestion.questionType} />
                        </div>
                        <p className="question-card__text">{currentQuestion.contentInstruction}</p>
                        {currentQuestion.contentImage && (
                            <img src={currentQuestion.contentImage} alt="Gambar soal" className="question-card__img" />
                        )}
                        {currentQuestion.contentAudio && (
                            <audio controls className="question-card__audio">
                                <source src={currentQuestion.contentAudio} />
                            </audio>
                        )}

                        {currentQuestion.questionType === 'QUIZ' && (
                            <QuizQuestion
                                question={currentQuestion}
                                answer={currentAnswer}
                                onAnswer={handleAnswer}
                            />
                        )}
                        {currentQuestion.questionType === 'MATCH' && (
                            <MatchQuestion
                                question={currentQuestion}
                                answer={currentAnswer}
                                onAnswer={handleAnswer}
                            />
                        )}
                        {currentQuestion.questionType === 'SORTING' && (
                            <SortingQuestion
                                question={currentQuestion}
                                answer={currentAnswer}
                                onAnswer={handleAnswer}
                            />
                        )}
                        {currentQuestion.questionType === 'DRAG_AND_DROP' && (
                            <DragAndDropQuestion
                                question={currentQuestion}
                                answer={currentAnswer}
                                onAnswer={handleAnswer}
                            />
                        )}
                    </div>
                ) : null}

                {/* Submit button */}
                {questions.length > 0 && (
                    <div className="quiz-footer">
                        <button
                            className={`quiz-btn quiz-btn--primary quiz-btn--lg ${!currentAnswered ? 'quiz-btn--disabled' : ''}`}
                            onClick={handleSubmitAnswer}
                            disabled={!currentAnswered || phase === 'submitting'}
                        >
                            {phase === 'submitting' ? 'Mengirim...' : 'Lanjut →'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default QuizStudentPage
