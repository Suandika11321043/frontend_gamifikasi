import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../utils/apiFetch'
import TypeBadge from '../../components/quiz/TypeBadge'
import MultipleChoiceOptions from '../../components/quiz/MultipleChoiceOptions'
import MatchReview from '../../components/quiz/MatchReview'
import MatchQuestion from '../../components/quiz/MatchQuestion'
import SortingReview from '../../components/quiz/SortingReview'
import PuzzleHistoryReview from '../../components/quiz/PuzzleHistoryReview'
import PoinIcon from '../../components/common/PoinIcon'
import { formatPuzzleResultBadge } from '../../utils/puzzleResult'
import './QuizStudentPage.css'

function toNumId(v) {
    if (v == null || v === '') return null
    const n = Number(v)
    return Number.isNaN(n) ? v : n
}

function parseSubmittedAnswer(raw) {
    if (raw == null || raw === '') return {}
    try {
        let val = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (typeof val === 'string') val = JSON.parse(val)
        if (Array.isArray(val)) return { selectedOptionIds: val.map(toNumId).filter((id) => id != null) }
        return val && typeof val === 'object' ? val : {}
    } catch {
        return {}
    }
}

function normalizeAnswerFields(parsed) {
    const selectedOptionIds = (parsed.selectedOptionIds ?? []).map(toNumId).filter((id) => id != null)
    const orderedOptionIds = (parsed.orderedOptionIds ?? []).map(toNumId).filter((id) => id != null)
    const matchingPairs = {}
    if (parsed.matchingPairs && typeof parsed.matchingPairs === 'object') {
        Object.entries(parsed.matchingPairs).forEach(([k, v]) => {
            const key = toNumId(k)
            if (key == null) return
            if (Array.isArray(v)) matchingPairs[key] = v.map(toNumId).filter((id) => id != null)
            else if (v != null) matchingPairs[key] = toNumId(v)
        })
    }
    const placements = Array.isArray(parsed.placements) ? parsed.placements : []
    const correctPieces = parsed.correctPieces ?? null
    const totalPieces = parsed.totalPieces ?? null
    return { selectedOptionIds, orderedOptionIds, matchingPairs, placements, correctPieces, totalPieces }
}

function isQuizType(type) {
    return type === 'QUIZ' || type === 'MULTIPLE_CHOICE'
}

function isMatchType(type) {
    return type === 'MATCH' || type === 'MATCHING' || type === 'DRAG_AND_DROP'
}

function hasStudentAnswer(item) {
    return item.correct != null
        || (item.submittedAnswer != null && item.submittedAnswer !== '')
        || (item.selectedOptionIds?.length > 0)
        || (item.orderedOptionIds?.length > 0)
        || Object.keys(item.matchingPairs ?? {}).length > 0
        || (item.placements?.length > 0)
}

const MONTH_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatLearningDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(`${dateStr}T00:00:00`)
    if (Number.isNaN(d.getTime())) return dateStr
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth() + 1]} ${d.getFullYear()}`
}

function computeSummary(questions) {
    const totalQuestions = questions.length
    const correctCount = questions.filter((q) => q.correct === true).length
    const wrongCount = questions.filter((q) => q.correct === false).length
    const unanswered = questions.filter((q) => q.correct == null).length
    const totalScore = questions.reduce((sum, q) => sum + (q.earnedScore ?? 0), 0)
    const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    return { totalQuestions, correctCount, wrongCount, unanswered, totalScore, pct }
}

function mergeQuestionItem(item, keyQ, topicData) {
    const parsed = normalizeAnswerFields(parseSubmittedAnswer(item.submittedAnswer))

    const keyOpts = (keyQ?.options ?? []).map((o) => ({
        ...o,
        optionId: toNumId(o.optionId ?? o.id),
    }))
    const opts = (item.options ?? []).map((o) => {
        const id = toNumId(o.optionId ?? o.id)
        const keyOpt = keyOpts.find((k) => k.optionId === id)
        return {
            ...o,
            optionId: id,
            urutanBenar: keyOpt?.urutanBenar,
            kunciJawaban: keyOpt?.kunciJawaban,
        }
    })

    const correctPairsMap = keyQ?.correctPairs?.length
        ? Object.fromEntries(
            keyQ.correctPairs.map((p) => [
                toNumId(p.opsiPertanyaanId),
                toNumId(p.opsiJawabanId),
            ])
        )
        : null

    return {
        ...item,
        ...parsed,
        options: opts.length > 0 ? opts : keyOpts,
        correctPairs: correctPairsMap,
        topicName: topicData?.nameTopic,
        topicIcon: topicData?.icon,
    }
}

function HistorySummary({ questions, topicId, studentId, learningDate, onBack, onBackToMap }) {
    const { correctCount, wrongCount, totalQuestions, totalScore, pct } = computeSummary(questions)
    const topicName = questions[0]?.topicName ?? `Tema ${topicId}`
    const dateLabel = formatLearningDate(learningDate)

    return (
        <div className="quiz-wrapper">
            <div className="quiz-decoration quiz-decoration--1" />
            <div className="quiz-decoration quiz-decoration--2" />
            <div className="quiz-container quiz-container--result">
                <p className="history-summary-tag">Riwayat Selesai</p>

                <div className="result-circle" style={{ '--pct': `${pct}%` }}>
                    <span className="result-circle__score">{pct}%</span>
                    <span className="result-circle__label">Skor</span>
            </div>

                <h2 className="result-title">
                    {pct >= 80 ? '🎉 Luar Biasa!' : pct >= 60 ? '👍 Bagus!' : pct >= 40 ? '💪 Terus Semangat!' : '📚 Ayo Coba Lagi!'}
                </h2>

                <div className="history-summary-meta">
                    <span className="quiz-topic-badge">
                        <span aria-hidden="true">📚</span>
                        {topicName}
                    </span>
                    {dateLabel && <span className="history-summary-date">{dateLabel}</span>}
                </div>

                <div className="result-stats">
                    <div className="result-stat">
                        <span className="result-stat__val">{correctCount}</span>
                        <span className="result-stat__lbl">Benar</span>
                    </div>
                    <div className="result-stat">
                        <span className="result-stat__val">{wrongCount}</span>
                        <span className="result-stat__lbl">Salah</span>
                                </div>
                    <div className="result-stat">
                        <span className="result-stat__val result-stat__val--points">
                            <PoinIcon size={28} />
                            +{totalScore}
                        </span>
                        <span className="result-stat__lbl">Total Poin</span>
                    </div>
                            </div>

                <p className="history-summary-caption">
                    {correctCount} dari {totalQuestions} soal benar
                </p>

                <div className="result-details">
                    <p className="result-details__title">Rincian Jawaban</p>
                    {questions.map((q, idx) => (
                        <div
                            key={q.questionId ?? idx}
                            className={`result-detail-row ${
                                q.correct === true
                                    ? 'result-detail-row--correct'
                                    : q.correct === false
                                        ? 'result-detail-row--wrong'
                                        : 'result-detail-row--skipped'
                            }`}
                        >
                            <span className="result-detail-num">Soal {idx + 1}</span>
                            <span className="result-detail-icon">
                                {q.correct === true ? '✓' : q.correct === false ? '✗' : '—'}
                            </span>
                            <span className="result-detail-score">
                                {q.correct != null ? `+${q.earnedScore ?? 0}` : 'Belum'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="result-actions">
                    <button
                        type="button"
                        className="quiz-btn quiz-btn--outline"
                        onClick={onBackToMap}
                    >
                        Kembali ke Peta
                    </button>
                    <button type="button" className="quiz-btn" onClick={onBack}>
                        Tinjau Ulang Soal
                    </button>
                </div>
                </div>
            </div>
        )
    }

function HistoryQuestionCard({ item, index, studentId }) {
    if (!item) return null

    const answered = hasStudentAnswer(item)

    if (!answered) {
        if (item.questionType === 'PUZZLE') {
            return (
                <div className="question-card" key={item.questionId}>
                    <div className="question-card__header">
                        <p className="question-card__num">Soal {index + 1}</p>
                        <TypeBadge type={item.questionType} />
                        <span className="history-result-badge">Belum dijawab</span>
                    </div>
                    <p className="question-card__text">{item.contentInstruction}</p>
                    <PuzzleHistoryReview
                        studentId={studentId}
                        questionId={item.questionId}
                        fallbackPlacements={[]}
                        contentImage={item.contentImage}
                    />
                </div>
            )
        }
        return (
            <div className="question-card" key={item.questionId}>
                <div className="question-card__header">
                    <p className="question-card__num">Soal {index + 1}</p>
                    <TypeBadge type={item.questionType} />
                    <span className="history-result-badge">Belum dijawab</span>
                </div>
                <p className="question-card__text">{item.contentInstruction}</p>
            </div>
        )
    }

    const selectedId = item.selectedOptionIds?.[0] ?? null
    const puzzleBadge = item.questionType === 'PUZZLE' ? formatPuzzleResultBadge(item) : null

    return (
        <div
            className={`question-card question-card--${item.correct ? 'correct' : item.correct === false ? 'wrong' : 'answered'}`}
            key={item.questionId}
        >
            <div className="question-card__header">
                <p className="question-card__num">Soal {index + 1}</p>
                <TypeBadge type={item.questionType} />
                {item.correct != null && (
                    puzzleBadge ? (
                        <span className={`history-result-badge history-result-badge--${puzzleBadge.variant}`}>
                            {puzzleBadge.text}
                        </span>
                    ) : (
                        <span className={`history-result-badge history-result-badge--${item.correct ? 'correct' : 'wrong'}`}>
                            {item.correct ? '✓ Benar' : '✗ Salah'}
                            {item.earnedScore != null && ` · +${item.earnedScore} poin`}
                        </span>
                    )
                )}
            </div>
            <p className="question-card__text">{item.contentInstruction}</p>
            {item.contentImage && item.questionType !== 'PUZZLE' && item.questionType !== 'MATCH' && (
                <img src={item.contentImage} alt="Gambar soal" className="question-card__img" />
            )}
            {item.questionType === 'PUZZLE' && (
                <PuzzleHistoryReview
                    studentId={studentId}
                    questionId={item.questionId}
                    fallbackPlacements={item.placements ?? []}
                    contentImage={item.contentImage}
                    earnedScore={item.earnedScore}
                />
            )}

            {isQuizType(item.questionType) && (
                <MultipleChoiceOptions
                    options={item.options ?? []}
                    selectedId={selectedId}
                    mode="review"
                    showCorrectAnswers={item.correct !== true}
                />
            )}

            {item.questionType === 'MATCH' && (
                <MatchQuestion
                    question={{ questionId: item.questionId, options: item.options ?? [] }}
                    answer={item.matchingPairs ?? {}}
                    readOnly
                />
            )}

            {item.questionType === 'DRAG_AND_DROP' && (
                <MatchReview
                    options={item.options ?? []}
                    matchingPairs={item.matchingPairs ?? {}}
                    correctPairs={item.correctPairs}
                    showCorrectAnswers={item.correct !== true}
                />
            )}

            {item.questionType === 'SORTING' && (
                <SortingReview
                    options={item.options ?? []}
                    orderedOptionIds={item.orderedOptionIds ?? []}
                    showCorrectOrder={item.correct !== true}
                />
            )}
        </div>
    )
}

export default function HistoryAnswerPage() {
    const { studentId, topicId, learningDate } = useParams()
    const navigate = useNavigate()

    const mapPath = `/student/siswa/${studentId}/topics/${topicId}/weeks`
    const goToMap = () => navigate(mapPath)

    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [currentIdx, setCurrentIdx] = useState(0)
    const [showSummary, setShowSummary] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const dateParam = learningDate ? `?date=${learningDate}` : ''
            const [answerData, topicData, answerKeyData] = await Promise.all([
                apiFetch(`/quiz/students/${studentId}/topics/${topicId}/answers${dateParam}`),
                apiFetch(`/topics/${topicId}`).catch(() => null),
                (topicId && learningDate)
                    ? apiFetch(`/quiz/topics/${topicId}/date/${learningDate}/questions/answer`).catch(() => [])
                    : Promise.resolve([]),
            ])

            const answerList = Array.isArray(answerData) ? answerData : (answerData?.data ?? [])
            const answerKeyList = Array.isArray(answerKeyData) ? answerKeyData : (answerKeyData?.data ?? [])
            const keyMap = Object.fromEntries(answerKeyList.map((q) => [q.questionId, q]))

            const mergedList = answerList.map((item) => mergeQuestionItem(item, keyMap[item.questionId], topicData))
            setQuestions(mergedList)
            setCurrentIdx(0)
            setShowSummary(false)
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [studentId, topicId, learningDate])

    useEffect(() => { fetchData() }, [fetchData])

    const summary = useMemo(() => computeSummary(questions), [questions])
    const currentItem = questions[currentIdx]
    const isLast = currentIdx === questions.length - 1
    const topicName = currentItem?.topicName ?? questions[0]?.topicName ?? `Tema ${topicId}`
    const topicIcon = currentItem?.topicIcon ?? questions[0]?.topicIcon ?? ''

    const handlePrev = () => {
        if (currentIdx > 0) setCurrentIdx((i) => i - 1)
    }

    const handleNext = () => {
        if (!isLast) setCurrentIdx((i) => i + 1)
        else setShowSummary(true)
    }

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
                    <button type="button" className="quiz-back-btn" onClick={goToMap}>← Kembali</button>
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
                    <button type="button" className="quiz-back-btn" onClick={goToMap}>← Kembali</button>
                    <p className="quiz-empty">Belum ada riwayat jawaban.</p>
                </div>
            </div>
        )
    }

    if (showSummary) {
        return (
            <HistorySummary
                questions={questions}
                topicId={topicId}
                studentId={studentId}
                learningDate={learningDate}
                onBack={() => setShowSummary(false)}
                onBackToMap={goToMap}
            />
        )
    }

    return (
        <div className="quiz-wrapper">
            <div className="quiz-decoration quiz-decoration--1" />
            <div className="quiz-decoration quiz-decoration--2" />
            <div className="quiz-container">
                <header className="quiz-header">
                    <button type="button" className="quiz-back-btn" onClick={goToMap}>← Kembali</button>
                    <div className="quiz-header__meta">
                        <span className="quiz-topic-badge">
                            {topicIcon
                                ? <img src={topicIcon} alt={topicName} className="quiz-topic-badge__icon" />
                                : <span aria-hidden="true">📚</span>}
                            {topicName}
                        </span>
                        <span className="quiz-progress">
                            Soal {currentIdx + 1} / {questions.length}
                            {learningDate ? ` · ${formatLearningDate(learningDate)}` : ''}
                        </span>
                    </div>
                </header>

                <div className="history-inline-stats">
                    <span>✓ {summary.correctCount} benar</span>
                    <span>✗ {summary.wrongCount} salah</span>
                    <span className="history-summary-points">
                        <PoinIcon size={20} /> +{summary.totalScore} poin
                    </span>
                </div>

                <div className="quiz-progress-bar">
                    <div
                        className="quiz-progress-bar__fill"
                        style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                </div>

                <HistoryQuestionCard item={currentItem} index={currentIdx} studentId={studentId} />

                <nav className="ha-nav" aria-label="Navigasi soal">
                    <button
                        type="button"
                        className="ha-nav-btn ha-nav-btn--prev"
                        onClick={handlePrev}
                        disabled={currentIdx === 0}
                        aria-label="Soal sebelumnya"
                    >
                        <span className="ha-nav-btn__icon" aria-hidden="true">◀</span>
                        <span className="ha-nav-btn__text">Sebelumnya</span>
                    </button>

                    {questions.length <= 10 ? (
                        <div className="ha-nav-dots" aria-hidden="true">
                            {questions.map((q, i) => (
                                <span
                                    key={q.questionId ?? i}
                                    className={`ha-nav-dot${i === currentIdx ? ' ha-nav-dot--active' : ''}${i < currentIdx ? ' ha-nav-dot--done' : ''}${q.correct === true ? ' ha-nav-dot--ok' : q.correct === false ? ' ha-nav-dot--bad' : ''}`}
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
                        className={`ha-nav-btn ha-nav-btn--next${isLast ? ' ha-nav-btn--finish' : ''}`}
                        onClick={handleNext}
                        aria-label={isLast ? 'Selesai' : 'Soal berikutnya'}
                    >
                        <span className="ha-nav-btn__text">{isLast ? 'Selesai!' : 'Berikutnya'}</span>
                        <span className="ha-nav-btn__icon" aria-hidden="true">{isLast ? '★' : '▶'}</span>
                    </button>
                </nav>
            </div>
        </div>
    )
}
