import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../utils/apiFetch'
import TypeBadge from '../../components/quiz/TypeBadge'
import './QuizStudentPage.css'

// ── Answer Review component ───────────────────────────────────────
// question & studentAnswer may be the same history item (combined shape)
function AnswerReview({ question, studentAnswer, puzzleReview }) {
    if (!question) return null
    const type = question.questionType
    // options may live on question directly or nested
    const opts = question.options ?? []

    if (type === 'QUIZ') {
        const chosen = studentAnswer?.selectedOptionIds?.[0]
        return (
            <div className="answer-review">
                <div className="ar-options">
                    {opts.map((opt) => {
                        const isChosen = opt.optionId === chosen
                        const isCorrect = opt.kunciJawaban === true
                        let cls = 'ar-option'
                        if (isChosen && isCorrect) cls += ' ar-option--correct'
                        else if (isChosen && !isCorrect) cls += ' ar-option--wrong'
                        return (
                            <div key={opt.optionId} className={cls}>
                                {opt.mediaOpsi && <img src={opt.mediaOpsi} alt="" className="ar-option__img" />}
                                <span className="ar-option__text">{opt.teksOpsi}</span>
                                {isChosen && (
                                    <span className={`ar-badge ${isCorrect ? 'ar-badge--chosen-correct' : 'ar-badge--wrong'}`}>
                                        {isCorrect ? '✓ Jawabanmu' : '✗ Jawabanmu'}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                    {!chosen && <p className="answer-review__label">Tidak ada jawaban</p>}
                </div>
            </div>
        )
    }

    if (type === 'SORTING') {
        const sorted = [...opts].sort((a, b) => (a.urutanBenar ?? 999) - (b.urutanBenar ?? 999))
        const studentOrder = studentAnswer?.orderedOptionIds ?? []
        const optById = Object.fromEntries(opts.map((o) => [o.optionId, o]))
        return (
            <div className="answer-review">
                {studentOrder.length > 0 ? (
                    <ol className="ar-sort-list">
                        {studentOrder.map((id, i) => {
                            const opt = optById[id]
                            const expectedAt = sorted.findIndex((o) => o.optionId === id)
                            const isOk = expectedAt === i
                            return (
                                <li key={id} className={`ar-sort-item${isOk ? ' ar-sort-item--ok' : ' ar-sort-item--bad'}`}>
                                    <span className="ar-sort-num">{i + 1}</span>
                                    {opt?.mediaOpsi && <img src={opt.mediaOpsi} alt="" className="ar-option__img" />}
                                    <span>{opt?.teksOpsi ?? `#${id}`}</span>
                                </li>
                            )
                        })}
                    </ol>
                ) : (
                    <p className="answer-review__label">Tidak ada jawaban</p>
                )}
            </div>
        )
    }

    if (type === 'MATCH' || type === 'DRAG_AND_DROP') {
        const optById = Object.fromEntries(opts.map((o) => [o.optionId, o]))
        const studentPairs = studentAnswer?.matchingPairs ?? {}
        // Split options: PERTANYAAN = left side, JAWABAN = right side
        const pertanyaanOpts = opts.filter((o) => o.tipeItem === 'PERTANYAAN' || o.tipeItem === 'SOAL')
        const jawabanOpts = opts.filter((o) => o.tipeItem === 'JAWABAN')
        // Fallback: if no tipeItem, use all opts
        const leftOpts = pertanyaanOpts.length > 0 ? pertanyaanOpts : opts

        const renderOption = (opt) => (
            <div className="ar-pair-opt">
                {opt.mediaOpsi && <img src={opt.mediaOpsi} alt="" className="ar-option__img" />}
                <span>{opt.teksOpsi}</span>
            </div>
        )

        if (Object.keys(studentPairs).length === 0) {
            return (
                <div className="answer-review">
                    <p className="answer-review__label">Tidak ada jawaban</p>
                </div>
            )
        }

        return (
            <div className="answer-review">
                <div className="ar-match-table">
                    <div className="ar-match-header">
                        <span>Pertanyaan</span>
                        <span />
                        <span>Jawabanmu</span>
                    </div>
                    {leftOpts.map((leftOpt) => {
                        const pId = leftOpt.optionId
                        const jVal = studentPairs[pId] ?? studentPairs[String(pId)]
                        const jIds = jVal != null ? (Array.isArray(jVal) ? jVal : [jVal]) : []
                        const hasAnswer = jIds.length > 0
                        return (
                            <div key={pId} className={`ar-match-row${hasAnswer ? '' : ' ar-match-row--empty'}`}>
                                <div className="ar-match-cell ar-match-cell--question">
                                    {renderOption(leftOpt)}
                                </div>
                                <span className="ar-match-arrow">→</span>
                                <div className="ar-match-cell ar-match-cell--answer">
                                    {hasAnswer
                                        ? jIds.map((id) => {
                                            const opt = optById[id]
                                            return opt
                                                ? <div key={id} className="ar-match-answer-item">{renderOption(opt)}</div>
                                                : <span key={id} className="ar-pair-empty">#{id}</span>
                                        })
                                        : <span className="ar-pair-empty">Tidak dijawab</span>
                                    }
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (type === 'PUZZLE') {
        // puzzleInfo is embedded in the history item; placements come from parsed submittedAnswer
        const puzzleInfo = question.puzzleInfo ?? puzzleReview
        const imageUrl = puzzleInfo?.imageUrl
        const gridCols = puzzleInfo?.gridCols
        const pieces = puzzleInfo?.pieces ?? []

        // placements from submittedAnswer: [{ pieceId, placedPosition }]
        const placements = question.placements ?? []
        // Build map: placedPosition → piece (from puzzleInfo)
        const pieceById = Object.fromEntries(pieces.map((p) => [p.pieceId, p]))
        const slotMap = {} // slot index → { piece, isCorrect }
        placements.forEach(({ pieceId, placedPosition }) => {
            const piece = pieceById[pieceId]
            if (piece) {
                const isCorrect = piece.correctPosition === placedPosition
                slotMap[placedPosition] = { piece, isCorrect }
            }
        })

        const totalSlots = pieces.length || placements.length

        if (!gridCols || totalSlots === 0) {
            return (
                <div className="answer-review">
                    {imageUrl && <img src={imageUrl} alt="Puzzle" className="answer-review__img" />}
                    <p className="answer-review__label">Data puzzle tidak tersedia</p>
                </div>
            )
        }

        return (
            <div className="answer-review">
                {imageUrl && (
                    <>
                        <p className="answer-review__label">Gambar puzzle:</p>
                        <img src={imageUrl} alt="Puzzle lengkap" className="answer-review__img" />
                    </>
                )}
                <p className="answer-review__label answer-review__label--wrong">Susunanmu:</p>
                <div className="ar-puzzle-grid" style={{ '--ar-cols': gridCols }}>
                    {Array.from({ length: totalSlots }, (_, i) => {
                        const entry = slotMap[i]
                        const isOk = entry?.isCorrect === true
                        return (
                            <div key={i} className={`ar-puzzle-cell${isOk ? ' ar-puzzle-cell--ok' : entry ? ' ar-puzzle-cell--bad' : ''}`}>
                                {entry?.piece?.pieceImageUrl
                                    ? <img src={entry.piece.pieceImageUrl} alt={`Keping ${i + 1}`} className="ar-puzzle-piece" />
                                    : <span className="ar-puzzle-empty">{i + 1}</span>}
                                <span className="ar-puzzle-badge">{isOk ? '✓' : entry ? '✗' : '—'}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return null
}

// ── History Answer Page ───────────────────────────────────────────
export default function HistoryAnswerPage() {
    const { studentId, topicId, learningDate } = useParams()
    const navigate = useNavigate()

    const [questions, setQuestions] = useState([])
    const [puzzleReviewMap, setPuzzleReviewMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [currentIdx, setCurrentIdx] = useState(0)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const params = new URLSearchParams()
            if (topicId) params.set('topicId', topicId)
            if (learningDate) params.set('date', learningDate)

            // Fetch history + question options in parallel
            const [historyData, answerData] = await Promise.all([
                apiFetch(`/questions/students/${studentId}/history?${params}`),
                (topicId && learningDate)
                    ? apiFetch(`/quiz/topics/${topicId}/date/${learningDate}/questions/answer`).catch(() => [])
                    : Promise.resolve([]),
            ])

            const historyList = Array.isArray(historyData) ? historyData : (historyData?.data ?? [])
            const answerList = Array.isArray(answerData) ? answerData : (answerData?.data ?? [])

            // Build options map: questionId → options[]
            const optionsMap = {}
            answerList.forEach((q) => { if (q.questionId) optionsMap[q.questionId] = q.options ?? [] })

            // Parse submittedAnswer JSON string and attach options to each item
            const mergedList = historyList.map((item) => {
                let parsed = {}
                try {
                    const raw = JSON.parse(item.submittedAnswer ?? '{}')
                    // Handle array format e.g. "[1]" → treat as selectedOptionIds
                    if (Array.isArray(raw)) {
                        parsed = { selectedOptionIds: raw }
                    } else {
                        parsed = raw
                    }
                } catch { /* ignore */ }
                return {
                    ...item,
                    ...parsed,
                    options: item.options?.length > 0 ? item.options : (optionsMap[item.questionId] ?? []),
                }
            }).reverse()

            setQuestions(mergedList)

            // Fetch puzzle placement data for each PUZZLE question
            const puzzleQuestions = mergedList.filter((q) => q.questionType === 'PUZZLE')
            if (puzzleQuestions.length > 0) {
                const puzzleResults = await Promise.all(
                    puzzleQuestions.map((q) =>
                        apiFetch(`/jigsaw/students/${studentId}/questions/${q.questionId}/review`)
                            .then((data) => ({ questionId: q.questionId, data }))
                            .catch(() => null)
                    )
                )
                const pMap = {}
                puzzleResults.forEach((r) => { if (r) pMap[r.questionId] = r.data })
                setPuzzleReviewMap(pMap)
            }
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [studentId, topicId, learningDate])

    useEffect(() => { fetchData() }, [fetchData])

    const currentItem = questions[currentIdx]
    const isLast = currentIdx === questions.length - 1

    const [showSummary, setShowSummary] = useState(false)

    const handlePrev = () => {
        if (currentIdx > 0) setCurrentIdx((i) => i - 1)
    }

    const handleNext = () => {
        if (!isLast) {
            setCurrentIdx((i) => i + 1)
        } else {
            setShowSummary(true)
        }
    }

    // Derive display info from current history item
    const topicName = currentItem?.topicName ?? `Topik ${topicId}`
    const topicIcon = currentItem?.topicIcon ?? currentItem?.icon ?? ''

    // ── Loading ───────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="quiz-wrapper">
                <div className="quiz-decoration quiz-decoration--1" />
                <div className="quiz-decoration quiz-decoration--2" />
                <p className="quiz-loading">Memuat riwayat jawaban...</p>
            </div>
        )
    }

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

    if (questions.length === 0) {
        return (
            <div className="quiz-wrapper">
                <div className="quiz-decoration quiz-decoration--1" />
                <div className="quiz-decoration quiz-decoration--2" />
                <div className="quiz-container">
                    <button className="quiz-back-btn" onClick={() => navigate(-1)}>← Kembali</button>
                    <p className="quiz-empty">Belum ada riwayat jawaban.</p>
                </div>
            </div>
        )
    }

    const puzzleReview = puzzleReviewMap[currentItem?.questionId]

    // ── Summary screen ────────────────────────────────────────────
    if (showSummary) {
        const totalScore = questions.reduce((sum, q) => sum + (q.earnedScore ?? 0), 0)
        const maxScore = questions.reduce((sum, q) => sum + (q.scorePoint ?? 0), 0)
        const correctCount = questions.filter((q) => q.correct).length
        return (
            <div className="quiz-wrapper">
                <div className="quiz-decoration quiz-decoration--1" />
                <div className="quiz-decoration quiz-decoration--2" />
                <div className="quiz-container">
                    <div className="result-card">
                        <div className="result-icon">🏆</div>
                        <h2 className="result-title">Riwayat Selesai</h2>
                        <p className="result-topic">{questions[0]?.topicName ?? `Topik ${topicId}`}</p>
                        <div className="result-score-box">
                            <span className="result-score-num">{totalScore}</span>
                            {maxScore > 0 && <span className="result-score-max"> / {maxScore} poin</span>}
                        </div>
                        <p className="result-correct">{correctCount} dari {questions.length} soal benar</p>
                    </div>
                    <div className="result-actions">
                        <button
                            className="quiz-btn quiz-btn--outline"
                            onClick={() => navigate(`/student/siswa/${studentId}/topics/${topicId}/weeks`)}
                        >
                            Kembali ke Peta
                        </button>
                    </div>
                </div>
            </div>
        )
    }

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
                                : <span aria-hidden="true">📚</span>}
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

                {/* Question info */}
                {currentItem && (
                    <div className={`question-card question-card--${currentItem.correct ? 'correct' : 'wrong'}`} key={currentItem.questionId}>
                        <div className="question-card__header">
                            <p className="question-card__num">Soal {currentIdx + 1}</p>
                            <TypeBadge type={currentItem.questionType} />
                            <span className={`history-result-badge history-result-badge--${currentItem.correct ? 'correct' : 'wrong'}`}>
                                {currentItem.correct ? '✓ Benar' : '✗ Salah'}
                                {currentItem.earnedScore != null && ` · +${currentItem.earnedScore} poin`}
                            </span>
                        </div>
                        <p className="question-card__text">{currentItem.contentInstruction}</p>
                        {currentItem.contentImage && (
                            <img src={currentItem.contentImage} alt="Gambar soal" className="question-card__img" />
                        )}
                    </div>
                )}

                {/* Student's answer */}
                <AnswerReview
                    question={currentItem}
                    studentAnswer={currentItem}
                    puzzleReview={puzzleReview}
                />

                {/* Navigation */}
                <div className="ha-nav">
                    <button
                        className={`ha-nav-btn ha-nav-btn--prev${currentIdx === 0 ? ' ha-nav-btn--ghost' : ''}`}
                        onClick={handlePrev}
                        disabled={currentIdx === 0}
                        aria-label="Soal sebelumnya"
                    >
                        <span className="ha-nav-arrow">👈</span>
                        <span className="ha-nav-label">Sebelumnya</span>
                    </button>

                    {/* Dot / count indicator */}
                    {questions.length <= 10 ? (
                        <div className="ha-nav-dots" aria-hidden="true">
                            {questions.map((_, i) => (
                                <span
                                    key={i}
                                    className={`ha-nav-dot${i === currentIdx ? ' ha-nav-dot--active' : i < currentIdx ? ' ha-nav-dot--done' : ''}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="ha-nav-counter">
                            <span className="ha-nav-counter-cur">{currentIdx + 1}</span>
                            <span className="ha-nav-counter-sep">/</span>
                            <span className="ha-nav-counter-tot">{questions.length}</span>
                        </div>
                    )}

                    <button
                        className="ha-nav-btn ha-nav-btn--next"
                        onClick={handleNext}
                        aria-label={isLast ? 'Selesai' : 'Soal berikutnya'}
                    >
                        <span className="ha-nav-label">{isLast ? 'Selesai!' : 'Berikutnya'}</span>
                        <span className="ha-nav-arrow">{isLast ? '🏆' : '👉'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
