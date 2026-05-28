import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { playCorrectSound, playWrongSound } from '../../utils/cursorSound.js'
import { apiFetch } from '../../utils/apiFetch'
import { isAnswered } from '../../utils/quizHelpers'
import QuizQuestion from '../../components/quiz/QuizQuestion'
import MatchQuestion from '../../components/quiz/MatchQuestion'
import SortingQuestion from '../../components/quiz/SortingQuestion'
import DragAndDropQuestion from '../../components/quiz/DragAndDropQuestion'
import PuzzleQuestion from '../../components/quiz/PuzzleQuestion'
import TypeBadge from '../../components/quiz/TypeBadge'
import './QuizStudentPage.css'

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

    // ── Timer state ───────────────────────────────────────────────
    const [timeLeft, setTimeLeft] = useState(null)
    const [timerTotal, setTimerTotal] = useState(null)
    // { [questionId]: timeLimitSeconds } — fetched from admin endpoint
    const [timeLimits, setTimeLimits] = useState({})
    // { [questionId]: scorePoint } — fetched from admin endpoint
    const [scorePoints, setScorePoints] = useState({})
    const submitFnRef = useRef(null)

    // ── Fetch questions + time limits ─────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const [topicData, questionData, adminQuestions] = await Promise.all([
                apiFetch(`/topics/${topicId}`),
                apiFetch(`/quiz/topics/${topicId}/questions`),
                apiFetch(`/questions?topicId=${topicId}`).catch(() => []),
            ])
            setTopicName(topicData.nameTopic ?? `Topik ${topicId}`)
            setTopicIcon(topicData.icon ?? '')
            setQuestions(Array.isArray(questionData) ? questionData : [])
            // Build map: questionId → timeLimitSeconds
            const limits = {}
            const scoreMap = {}
            const adminList = Array.isArray(adminQuestions)
                ? adminQuestions
                : (adminQuestions?.data ?? [])
            adminList.forEach((q) => {
                if (q.id && q.timeLimitMinutes) limits[q.id] = q.timeLimitMinutes * 60
                if (q.id && q.scorePoint) scoreMap[q.id] = q.scorePoint
            })
            setTimeLimits(limits)
            setScorePoints(scoreMap)
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [topicId])

    useEffect(() => { fetchData() }, [fetchData])

    // currentQuestion must be declared before any effect that references it
    const currentQuestion = questions[currentIdx]

    // ── Init timer when question changes ──────────────────────────
    useEffect(() => {
        if (!currentQuestion || phase !== 'quiz') return
        // Prefer timeLimits map (from admin endpoint); fall back to field on question
        const limit = timeLimits[currentQuestion.questionId]
            ?? (currentQuestion.timeLimitMinutes ? currentQuestion.timeLimitMinutes * 60 : 0)
            ?? 0
        if (!limit || limit <= 0) {
            setTimeLeft(null)
            setTimerTotal(null)
            return
        }
        setTimerTotal(limit)
        // Restore from sessionStorage (persists across page refreshes in same tab)
        const storageKey = `quiz_timer_${studentId}_${topicId}_${currentQuestion.questionId}`
        const saved = sessionStorage.getItem(storageKey)
        const savedTime = saved ? parseInt(saved, 10) : NaN
        setTimeLeft(!isNaN(savedTime) && savedTime > 0 && savedTime <= limit ? savedTime : limit)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion?.questionId, timeLimits])

    // ── Countdown tick ────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft === null || phase !== 'quiz') return
        if (timeLeft <= 0) {
            // Trigger auto-submit via stable ref
            submitFnRef.current?.(true)
            return
        }
        // Save to sessionStorage on every tick so refresh restores exact remaining time
        if (currentQuestion) {
            const storageKey = `quiz_timer_${studentId}_${topicId}_${currentQuestion.questionId}`
            sessionStorage.setItem(storageKey, String(timeLeft))
        }
        const id = setTimeout(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
        return () => clearTimeout(id)
    }, [timeLeft, phase])

    // Auto-init SORTING answer when question changes
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
    const handleSubmitAnswer = async (force = false) => {
        // Clear sessionStorage timer for this question
        if (currentQuestion) {
            sessionStorage.removeItem(`quiz_timer_${studentId}_${topicId}_${currentQuestion.questionId}`)
        }
        setTimeLeft(null) // stop timer
        setPhase('submitting')
        setSubmitError('')
        try {
            let data
            if (currentQuestion.questionType === 'PUZZLE') {
                const raw = await apiFetch('/jigsaw/submit', {
                    method: 'POST',
                    body: JSON.stringify({
                        studentId: Number(studentId),
                        questionId: currentQuestion.questionId,
                        placements: currentAnswer || [],
                    }),
                })
                // Normalize puzzle response to match quiz response shape
                data = {
                    ...raw,
                    correct: raw.isCorrect,
                    questionId: currentQuestion.questionId,
                }
            } else {
                data = await apiFetch('/quiz/submit/answer', {
                    method: 'POST',
                    body: JSON.stringify({
                        studentId: Number(studentId),
                        topicId: Number(topicId),
                        answer: buildAnswerPayload(currentQuestion, currentAnswer),
                    }),
                })
            }
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

    // Keep ref current so the countdown effect can call the latest version
    submitFnRef.current = handleSubmitAnswer
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
            // Clear all sessionStorage timer keys for this quiz session
            Object.keys(sessionStorage)
                .filter((k) => k.startsWith(`quiz_timer_${studentId}_${topicId}_`))
                .forEach((k) => sessionStorage.removeItem(k))
            // Delete persisted timer for this session
            apiFetch(`/quiz/timer/${studentId}/${topicId}`, { method: 'DELETE' }).catch(() => { })
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
        const rankName = result?.rankName ?? ''
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
                        {finalTotalStars > 0 && (
                            <div className="result-stat">
                                <span className="result-stat__val result-stat__val--stars">⭐ {finalTotalStars}</span>
                                <span className="result-stat__lbl">Total Bintang</span>
                            </div>
                        )}
                    </div>

                    {/* Rank badge */}
                    {rankName && (
                        <div className="result-rank-badge">
                            🏅 Rank: <strong>{rankLabels[rankName] ?? rankName}</strong>
                        </div>
                    )}

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
                            Pilih Topik Lain
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

                        {/* Puzzle piece-result grid */}
                        {feedback.pieceResults && (
                            <div className="fpz-results">
                                <p className="fpz-summary">
                                    <span className="fpz-count">{feedback.correctPiecesCount}</span>
                                    <span className="fpz-sep">/</span>
                                    <span className="fpz-total">{feedback.totalPieces}</span>
                                    {' '}keping benar
                                </p>
                                <div
                                    className="fpz-grid"
                                    style={{ '--fpz-cols': Math.round(Math.sqrt(feedback.totalPieces)) }}
                                >
                                    {Array.from({ length: feedback.totalPieces }, (_, slotIdx) => {
                                        const pr = feedback.pieceResults.find((r) => r.placedPosition === slotIdx)
                                        const ok = pr?.isCorrect ?? false
                                        const placed = pr != null
                                        return (
                                            <div
                                                key={slotIdx}
                                                className={`fpz-cell${ok ? ' fpz-cell--ok' : placed ? ' fpz-cell--bad' : ' fpz-cell--empty'}`}
                                            >
                                                {ok ? '✓' : placed ? '✗' : '—'}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {isCorrect ? (
                            <p className="feedback-score">+{earned} poin</p>
                        ) : (
                            <>
                                <p className="feedback-msg">Tetap semangat, terus berlatih!</p>
                                {!feedback.pieceResults && (currentQuestion?.scorePoint || scorePoints[currentQuestion?.questionId]) && (
                                    <p className="feedback-missed-pts">
                                        Sayang, kamu melewatkan {currentQuestion?.scorePoint ?? scorePoints[currentQuestion?.questionId]} poin
                                    </p>
                                )}
                            </>
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
                    {/* Circular countdown ring — only when question has a time limit */}
                    {timeLeft !== null && timerTotal !== null && (
                        <div
                            className={`quiz-timer-ring${timeLeft <= 10 ? ' quiz-timer-ring--urgent' : ''}`}
                            style={{
                                '--timer-pct': `${(timeLeft / timerTotal) * 360}deg`,
                                '--timer-color': timeLeft / timerTotal > 0.5
                                    ? '#10b981'
                                    : timeLeft / timerTotal > 0.25
                                        ? '#f59e0b'
                                        : '#ef4444',
                            }}
                            aria-label={`Sisa waktu: ${timeLeft} detik`}
                        >
                            <span className="quiz-timer-ring__num">{timeLeft}</span>
                            <span className="quiz-timer-ring__unit">dtk</span>
                        </div>
                    )}
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
                    <p className="quiz-empty">Tidak ada soal pada topik ini.</p>
                ) : currentQuestion ? (
                    <div className="question-card" key={currentQuestion.questionId}>
                        <div className="question-card__header">
                            <p className="question-card__num">Soal {currentIdx + 1}</p>
                            <TypeBadge type={currentQuestion.questionType} />
                            {(currentQuestion.scorePoint || scorePoints[currentQuestion.questionId]) && (
                                <span className="question-score-badge">
                                    🏆 {currentQuestion.scorePoint ?? scorePoints[currentQuestion.questionId]} poin
                                </span>
                            )}
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
                        {currentQuestion.questionType === 'PUZZLE' && (
                            <PuzzleQuestion
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
                            className="quiz-btn quiz-btn--primary quiz-btn--lg"
                            onClick={handleSubmitAnswer}
                            disabled={phase === 'submitting'}
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
