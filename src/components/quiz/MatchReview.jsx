import './MatchReview.css'

const PAIR_COLORS = [
    { bg: '#eff6ff', border: '#60a5fa', accent: '#2563eb' },
    { bg: '#fef9c3', border: '#fbbf24', accent: '#d97706' },
    { bg: '#ecfdf5', border: '#4ade80', accent: '#16a34a' },
    { bg: '#fce7f3', border: '#f472b6', accent: '#db2777' },
    { bg: '#ede9fe', border: '#a78bfa', accent: '#7c3aed' },
    { bg: '#ffedd5', border: '#fb923c', accent: '#ea580c' },
]

function MatchOptionCard({ opt, side, index, empty }) {
    const color = PAIR_COLORS[index % PAIR_COLORS.length]

    if (empty) {
        return (
            <div className="mr-card mr-card--empty" style={{ '--mr-bg': color.bg, '--mr-border': color.border }}>
                <span className="mr-card__placeholder">Belum dijawab 🙈</span>
            </div>
        )
    }

    if (!opt) return null

    const hasMedia = !!opt.mediaOpsi
    const hasText = !!(opt.teksOpsi && opt.teksOpsi.trim())

    return (
        <div
            className={`mr-card mr-card--${side}${hasMedia ? ' mr-card--has-media' : ''}`}
            style={{ '--mr-bg': color.bg, '--mr-border': color.border, '--mr-accent': color.accent }}
        >
            <span className="mr-card__side-badge">{side === 'question' ? '💬' : '✅'}</span>
            {hasMedia && (
                <img src={opt.mediaOpsi} alt={opt.teksOpsi || 'Media'} className="mr-card__img" />
            )}
            {hasText && <span className="mr-card__text">{opt.teksOpsi}</span>}
            {!hasMedia && !hasText && <span className="mr-card__text mr-card__text--muted">—</span>}
        </div>
    )
}

/**
 * Tinjau ulang soal cocokkan — UI seragam, mendukung media.
 * studentOnly: hanya tampilkan jawaban yang dipilih siswa (untuk riwayat).
 */
export default function MatchReview({
    options = [],
    matchingPairs = {},
    correctPairs = null,
    showCorrectAnswers = false,
    studentOnly = false,
}) {
    const optById = Object.fromEntries(options.map((o) => [o.optionId, o]))
    const pertanyaanOpts = options.filter((o) => o.tipeItem === 'PERTANYAAN' || o.tipeItem === 'SOAL')
    const leftOpts = pertanyaanOpts.length > 0 ? pertanyaanOpts : options

    const pairs = matchingPairs ?? {}
    const hasAnyPair = Object.keys(pairs).length > 0

    if (leftOpts.length === 0 && !hasAnyPair) {
        return <p className="mr-empty">Data soal tidak lengkap.</p>
    }

    if (studentOnly) {
        const pairEntries = Object.entries(pairs)
        if (pairEntries.length === 0) {
            return <p className="mr-empty">Belum ada jawaban 🙈</p>
        }
        return (
            <div className="mr-list mr-list--student">
                <p className="mr-student-hint">↳ Jawabanmu</p>
                {pairEntries.map(([pId, jVal], idx) => {
                    const qId = Number(pId)
                    const jIds = jVal != null ? (Array.isArray(jVal) ? jVal : [jVal]) : []
                    const answerOpt = jIds.length > 0 ? (optById[jIds[0]] ?? optById[Number(jIds[0])]) : null
                    const questionOpt = optById[qId] ?? optById[pId]
                    return (
                        <div key={pId} className="mr-student-pair">
                            <div className="mr-student-pair__head">
                                <span className="mr-row__num">{idx + 1}</span>
                                {questionOpt?.teksOpsi && (
                                    <span className="mr-student-pair__q">{questionOpt.teksOpsi}</span>
                                )}
                            </div>
                            <MatchOptionCard
                                opt={answerOpt}
                                side="answer"
                                index={idx}
                                empty={!answerOpt}
                            />
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="mr-list">
            {!hasAnyPair && <p className="mr-empty mr-empty--inline">Belum ada jawaban 🙈</p>}
            {leftOpts.map((leftOpt, idx) => {
                const pId = leftOpt.optionId
                const jVal = pairs[pId] ?? pairs[String(pId)]
                const jIds = jVal != null ? (Array.isArray(jVal) ? jVal : [jVal]) : []
                const answerOpt = jIds.length > 0 ? optById[jIds[0]] : null

                let rowState = 'neutral'
                if (correctPairs && showCorrectAnswers) {
                    const correctJ = correctPairs[pId] ?? correctPairs[String(pId)]
                    const correctId = Array.isArray(correctJ) ? correctJ[0] : correctJ
                    if (jIds.length > 0 && correctId != null) {
                        rowState = jIds[0] === correctId ? 'ok' : 'bad'
                    }
                }

                return (
                    <div key={pId} className={`mr-row mr-row--${rowState}`}>
                        <div className="mr-row__num">{idx + 1}</div>
                        <MatchOptionCard opt={leftOpt} side="question" index={idx} />
                        <div className="mr-row__link" aria-hidden="true">
                            <span className="mr-row__arrow">➜</span>
                        </div>
                        <MatchOptionCard
                            opt={answerOpt}
                            side="answer"
                            index={idx}
                            empty={!answerOpt}
                        />
                    </div>
                )
            })}
        </div>
    )
}
