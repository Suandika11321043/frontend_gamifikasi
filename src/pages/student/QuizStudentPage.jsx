import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { playCorrectSound, playWrongSound } from '../../utils/cursorSound.js'
import { apiFetch } from '../../utils/apiFetch'
import QuizQuestion from '../../components/quiz/QuizQuestion'
import MatchQuestion from '../../components/quiz/MatchQuestion'
import SortingQuestion from '../../components/quiz/SortingQuestion'
import DragAndDropQuestion from '../../components/quiz/DragAndDropQuestion'
import PuzzleQuestion from '../../components/quiz/PuzzleQuestion'
import TypeBadge from '../../components/quiz/TypeBadge'
import QuizFeedbackPopup from '../../components/quiz/QuizFeedbackPopup'
import { formatPuzzleResultBadge } from '../../utils/puzzleResult'
import {
    SAVE_INTERVAL_MS,
    getTimerStorageKey,
    computeRemainingFromServer,
    fetchTimerFromServer,
    saveTimerToServer,
    clearTimerOnServer,
    clearAllTimersOnServer,
    readLocalTimer,
    writeLocalTimer,
    clearLocalTimers,
} from '../../utils/quizTimer'
import './QuizStudentPage.css'

// ── Main Page ─────────────────────────────────────────────────────
function QuizStudentPage() {
    const { studentId, topicId, learningDate, weekId, dayId } = useParams()
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
    const lastServerSaveRef = useRef(0)
    const timerScopeId = learningDate ?? dayId ?? topicId
    // { [questionId]: answer data } — pre-loaded from server so already-answered questions are view-only
    const [answeredMap, setAnsweredMap] = useState({})
    const [draftAnswers, setDraftAnswers] = useState({})

    // ── Fetch questions + time limits ─────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const questionsUrl = learningDate
                ? `/quiz/topics/${topicId}/date/${learningDate}/questions`
                : dayId
                    ? `/quiz/days/${dayId}/questions`
                    : `/quiz/topics/${topicId}/questions`
            const adminUrl = learningDate
                ? `/questions/topic/${topicId}/date/${learningDate}`
                : dayId
                    ? `/questions?dayId=${dayId}`
                    : `/questions?topicId=${topicId}`
            const [topicData, questionData, adminQuestions, statusGroups] = await Promise.all([
                apiFetch(`/topics/${topicId}`),
                apiFetch(questionsUrl),
                apiFetch(adminUrl).catch(() => []),
                learningDate
                    ? apiFetch(`/questions/topic/${topicId}/student/${studentId}`).catch(() => [])
                    : Promise.resolve([]),
            ])
            setTopicName(topicData.nameTopic ?? `Tema ${topicId}`)
            setTopicIcon(topicData.icon ?? '')

            const questionList = Array.isArray(questionData) ? questionData : []
            const groupList = Array.isArray(statusGroups) ? statusGroups : (statusGroups?.data ?? [])

            // Use status endpoint to detect which questions are done
            const dateGroup = groupList.find((g) => g.learningDate === learningDate)
            const answeredIds = new Set(
                (dateGroup?.questions ?? []).filter((q) => q.status === 'SELESAI').map((q) => q.id)
            )

            // If all questions are done, redirect to dedicated review page
            const allDone = learningDate != null &&
                questionList.length > 0 &&
                questionList.every((q) => answeredIds.has(q.questionId))

            if (allDone) {
                navigate(`/student/siswa/${studentId}/topics/${topicId}/dates/${learningDate}/review`, { replace: true })
                return
            }

            setQuestions(questionList)

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

            // Mark already-answered questions as view-only
            const aMap = {}
            questionList.forEach((q) => {
                if (answeredIds.has(q.questionId)) {
                    aMap[q.questionId] = { questionId: q.questionId, isReviewOnly: true }
                }
            })
            setAnsweredMap(aMap)
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [topicId, studentId, learningDate, dayId])

    useEffect(() => { fetchData() }, [fetchData])

    // currentQuestion must be declared before any effect that references it
    const currentQuestion = questions[currentIdx]

    // ── Restore progress from previous answers when data loads ────
    useEffect(() => {
        if (loading || !questions.length || !Object.keys(answeredMap).length) return
        const history = []
        let correct = 0
        let score = 0
        questions.forEach((q) => {
            const ans = answeredMap[q.questionId]
            // Skip review-only entries — they have no real score data to restore
            if (ans && !ans.isReviewOnly) {
                history.push({ questionId: q.questionId, correct: ans.correct ?? false, earnedScore: ans.earnedScore ?? 0 })
                if (ans.correct) correct++
                score += ans.earnedScore ?? 0
            }
        })
        if (history.length > 0) {
            setAnswerHistory(history)
            setCorrectCount(correct)
            setTotalScore(score)
        }
    }, [loading, questions, answeredMap])

    // ── Lewati soal yang sudah dijawab sebelumnya (dari server)
    useEffect(() => {
        if (!currentQuestion || loading || phase !== 'quiz') return
        const prev = answeredMap[currentQuestion.questionId]
        if (!prev?.isReviewOnly) return
        const nextUnanswered = questions.findIndex((q, i) => i > currentIdx && !answeredMap[q.questionId])
        if (nextUnanswered !== -1) {
            setCurrentIdx(nextUnanswered)
        }
    }, [currentIdx, answeredMap, loading, questions, phase])
    useEffect(() => {
        if (!currentQuestion || phase !== 'quiz') return
        const limit = timeLimits[currentQuestion.questionId]
            ?? (currentQuestion.timeLimitMinutes ? currentQuestion.timeLimitMinutes * 60 : 0)
            ?? 0
        if (!limit || limit <= 0) {
            setTimeLeft(null)
            setTimerTotal(null)
            return
        }
        setTimerTotal(limit)
        let cancelled = false
        const storageKey = getTimerStorageKey(studentId, timerScopeId, currentQuestion.questionId)

        ;(async () => {
            let restored = null
            const serverTimer = await fetchTimerFromServer(apiFetch, studentId, topicId, currentQuestion.questionId)
            if (serverTimer) {
                restored = computeRemainingFromServer(serverTimer, limit)
            }
            if (restored == null) {
                restored = readLocalTimer(storageKey, limit)
            }
            if (restored == null) restored = limit

            if (cancelled) return
            if (restored <= 0) {
                submitFnRef.current?.(true)
                return
            }
            setTimeLeft(restored)
            writeLocalTimer(storageKey, restored)
        })()

        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion?.questionId, timeLimits, phase])

    // ── Countdown tick ────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft === null || phase !== 'quiz' || !currentQuestion) return
        if (timeLeft <= 0) {
            submitFnRef.current?.(true)
            return
        }
        const storageKey = getTimerStorageKey(studentId, timerScopeId, currentQuestion.questionId)
        writeLocalTimer(storageKey, timeLeft)

        const now = Date.now()
        if (now - lastServerSaveRef.current >= SAVE_INTERVAL_MS) {
            lastServerSaveRef.current = now
            saveTimerToServer(apiFetch, {
                studentId,
                topicId,
                questionId: currentQuestion.questionId,
                remainingSeconds: timeLeft,
            }).catch(() => {})
        }

        const id = setTimeout(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
        return () => clearTimeout(id)
    }, [timeLeft, phase, currentQuestion?.questionId, studentId, topicId, timerScopeId])

    // Simpan timer ke server saat tab ditutup / disembunyikan
    useEffect(() => {
        if (!currentQuestion || timeLeft == null || phase !== 'quiz') return

        const persistNow = () => {
            saveTimerToServer(apiFetch, {
                studentId,
                topicId,
                questionId: currentQuestion.questionId,
                remainingSeconds: timeLeft,
            }).catch(() => {})
        }

        const onVisibility = () => {
            if (document.visibilityState === 'hidden') persistNow()
        }

        window.addEventListener('beforeunload', persistNow)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('beforeunload', persistNow)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [currentQuestion?.questionId, timeLeft, phase, studentId, topicId])

    // Muat jawaban draft saat pindah soal
    useEffect(() => {
        if (!currentQuestion) return
        const draft = draftAnswers[currentQuestion.questionId]
        if (draft !== undefined) {
            setCurrentAnswer(draft)
            return
        }
        if (currentQuestion.questionType === 'SORTING') {
            setCurrentAnswer(currentQuestion.options.map((o) => o.optionId))
        } else {
            setCurrentAnswer(undefined)
        }
    }, [currentIdx, currentQuestion?.questionId])

    const handleAnswer = (questionId, value) => {
        setCurrentAnswer(value)
        setDraftAnswers((m) => ({ ...m, [questionId]: value }))
    }

    // Build per-question answer payload
    const buildAnswerPayload = (q, a) => {
        const base = { questionId: q.questionId }
        if (q.questionType === 'QUIZ') {
            return { ...base, selectedOptionIds: (a != null && a !== undefined) ? [a] : [] }
        }
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

    // Submit jawaban — selalu dikirim; kosong jika belum dijawab
    const handleSubmitAnswer = async () => {
        if (currentQuestion) {
            const storageKey = getTimerStorageKey(studentId, timerScopeId, currentQuestion.questionId)
            sessionStorage.removeItem(storageKey)
            clearTimerOnServer(apiFetch, studentId, topicId, currentQuestion.questionId)
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
                    correctPieces: raw.correctPiecesCount,
                    totalPieces: raw.totalPieces,
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
            setAnswerHistory((h) => [...h, {
                questionId: data.questionId,
                correct: data.correct,
                earnedScore: earned,
                correctPieces: data.correctPieces,
                totalPieces: data.totalPieces,
                questionType: currentQuestion.questionType,
            }])
            if (data.correct) playCorrectSound()
            else playWrongSound()
            setFeedback(data)
            setAnsweredMap((m) => ({
                ...m,
                [currentQuestion.questionId]: {
                    questionId: currentQuestion.questionId,
                    correct: data.correct,
                    earnedScore: earned,
                },
            }))
            setPhase('feedback')
        } catch (err) {
            const errMsg = err.message ?? ''
            // If backend rejects because already answered, fetch existing answer and show view-only
            if ((errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('sudah')) && currentQuestion) {
                setPhase('quiz')
                apiFetch(`/quiz/students/${studentId}/questions/${currentQuestion.questionId}/answer`)
                    .then((prev) => setAnsweredMap((m) => ({ ...m, [currentQuestion.questionId]: { ...prev, questionId: currentQuestion.questionId } })))
                    .catch(() => { setSubmitError(errMsg); setPhase('quiz') })
            } else {
                setSubmitError(errMsg)
                setPhase('quiz')
            }
        }
    }

    // Keep ref current so the countdown effect can call the latest version
    submitFnRef.current = handleSubmitAnswer

    const finishQuiz = async () => {
        setPhase('finishing')
        setSubmitError('')
        clearLocalTimers(studentId, timerScopeId)
        clearAllTimersOnServer(apiFetch, studentId, topicId)
        try {
            const finishData = await apiFetch('/quiz/finish', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: Number(studentId),
                    topicId: Number(topicId),
                    learningDate: learningDate ?? dayId ?? null,
                    correctCount,
                    totalQuestions: questions.length,
                }),
            })
            setResult(finishData)
            setPhase('result')
        } catch (err) {
            setSubmitError(err.message)
            setPhase('quiz')
        }
    }

    const handleFooterNext = () => {
        if (phase === 'submitting') return
        handleSubmitAnswer()
    }

    const handleNext = async () => {
        const isLast = currentIdx === questions.length - 1
        if (!isLast) {
            setFeedback(null)
            setCurrentAnswer(undefined)
            setCurrentIdx((i) => i + 1)
            setPhase('quiz')
        } else {
            if (answeredMap[currentQuestion?.questionId]?.isReviewOnly) {
                setPhase('result')
                return
            }
            await finishQuiz()
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

                    {/* Bintang sesi = jumlah soal benar */}
                    <div className="result-stars">
                        <span className="result-stars-count">⭐ {stars}</span>
                        <span className="result-stars-label">bintang hari ini · {correct} soal benar</span>
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
                            {answerHistory.map((d, idx) => {
                                const puzzleBadge = d.questionType === 'PUZZLE' ? formatPuzzleResultBadge(d) : null
                                const rowClass = puzzleBadge
                                    ? `result-detail-row result-detail-row--${puzzleBadge.variant}`
                                    : `result-detail-row ${d.correct ? 'result-detail-row--correct' : 'result-detail-row--wrong'}`
                                return (
                                    <div key={d.questionId} className={rowClass}>
                                        <span className="result-detail-num">Soal {idx + 1}</span>
                                        {puzzleBadge ? (
                                            <span className="result-detail-puzzle">{puzzleBadge.text}</span>
                                        ) : (
                                            <>
                                                <span className="result-detail-icon">{d.correct ? '✓' : '✗'}</span>
                                                <span className="result-detail-score">+{d.earnedScore ?? 0}</span>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

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

    // ── Quiz screen (+ popup feedback di atasnya) ─────────────────
    const isLastQuestion = currentIdx === questions.length - 1

    return (
        <div className={`quiz-wrapper${phase === 'feedback' ? ' quiz-wrapper--has-popup' : ''}`}>
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
                    <div className={`question-card${currentQuestion.questionType === 'PUZZLE' ? ' question-card--puzzle' : ''}`} key={currentQuestion.questionId}>
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
                        {currentQuestion.contentImage && currentQuestion.questionType !== 'PUZZLE' && (
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

                {questions.length > 0 && phase !== 'feedback' && (
                    <nav className="ha-nav quiz-nav quiz-nav--forward-only" aria-label="Navigasi soal">
                        {questions.length <= 10 ? (
                            <div className="ha-nav-dots" aria-hidden="true">
                                {questions.map((_, i) => (
                                    <span
                                        key={i}
                                        className={`ha-nav-dot${i === currentIdx ? ' ha-nav-dot--active' : ''}${i < currentIdx ? ' ha-nav-dot--done' : ''}`}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="ha-nav-counter" aria-hidden="true">
                                <span className="ha-nav-counter-cur">{currentIdx + 1}</span>
                                <span className="ha-nav-counter-sep">/</span>
                                <span className="ha-nav-counter-tot">{questions.length}</span>
                            </div>
                        )}

                        <button
                            type="button"
                            className={`ha-nav-btn ha-nav-btn--next${isLastQuestion ? ' ha-nav-btn--finish' : ''}`}
                            onClick={handleFooterNext}
                            disabled={phase === 'submitting'}
                            aria-label={isLastQuestion ? 'Selesai' : 'Soal berikutnya'}
                        >
                            <span className="ha-nav-btn__text">
                                {phase === 'submitting'
                                    ? 'Mengirim...'
                                    : isLastQuestion
                                        ? 'Selesai!'
                                        : 'Selanjutnya'}
                            </span>
                            <span className="ha-nav-btn__icon" aria-hidden="true">
                                {phase === 'submitting' ? '…' : isLastQuestion ? '★' : '▶'}
                            </span>
                        </button>
                    </nav>
                )}
            </div>

            {phase === 'feedback' && feedback && (
                <QuizFeedbackPopup
                    popup
                    earned={feedback.earnedScore ?? 0}
                    isCorrect={feedback.correct}
                    puzzleCorrectPieces={feedback.correctPieces}
                    puzzleTotalPieces={feedback.totalPieces}
                    onNext={handleNext}
                    isLast={isLastQuestion}
                    disabled={phase === 'finishing'}
                />
            )}
        </div>
    )
}

export default QuizStudentPage
