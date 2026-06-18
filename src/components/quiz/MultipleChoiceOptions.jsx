import './MultipleChoiceOptions.css'

const LETTER_COLORS = [
    { bg: '#fef9c3', border: '#fbbf24', letter: '#b45309', shadow: '#d97706' },
    { bg: '#dbeafe', border: '#60a5fa', letter: '#1d4ed8', shadow: '#2563eb' },
    { bg: '#dcfce7', border: '#4ade80', letter: '#15803d', shadow: '#16a34a' },
    { bg: '#fce7f3', border: '#f472b6', letter: '#be185d', shadow: '#db2777' },
    { bg: '#ede9fe', border: '#a78bfa', letter: '#6d28d9', shadow: '#7c3aed' },
    { bg: '#ffedd5', border: '#fb923c', letter: '#c2410c', shadow: '#ea580c' },
]

function getOptionState(opt, mode, selectedId, showCorrectAnswers) {
    const optId = opt.optionId
    const sel = selectedId != null ? Number(selectedId) : null
    const oid = optId != null ? Number(optId) : null
    const isSelected = sel != null && oid != null && sel === oid
    if (mode === 'quiz') {
        return isSelected ? 'selected' : 'idle'
    }
    const isChosen = isSelected
    const isCorrect = opt.kunciJawaban === true
    if (selectedId == null) return 'idle'
    if (isChosen && isCorrect) return 'chosen-correct'
    if (isChosen && !isCorrect) return 'chosen-wrong'
    if (!isChosen && isCorrect && showCorrectAnswers) return 'correct'
    return 'idle'
}

function OptionBadge({ state }) {
    if (state === 'chosen-correct') {
        return <span className="mc-option__badge mc-option__badge--win">✓ Jawabanmu!</span>
    }
    if (state === 'chosen-wrong') {
        return <span className="mc-option__badge mc-option__badge--lose">✗ Jawabanmu</span>
    }
    if (state === 'correct') {
        return <span className="mc-option__badge mc-option__badge--answer">★ Jawaban Benar</span>
    }
    if (state === 'selected') {
        return <span className="mc-option__badge mc-option__badge--pick">★ Dipilih</span>
    }
    return null
}

/**
 * Pilihan ganda — UI seragam untuk mode kuis, tinjau ulang, dan belum dijawab.
 * mode: 'quiz' (interaktif) | 'review' (readonly)
 */
export default function MultipleChoiceOptions({
    options = [],
    selectedId = null,
    mode = 'quiz',
    showCorrectAnswers = false,
    onSelect,
    disabled = false,
}) {
    const allHaveImg = options.length > 0 && options.every((o) => !!o.mediaOpsi)
    const isInteractive = mode === 'quiz' && !disabled

    if (options.length === 0) {
        return <p className="mc-empty-msg">Belum ada pilihan jawaban.</p>
    }

    return (
        <div className={`mc-options${allHaveImg ? ' mc-options--grid' : ''}`}>
            {options.map((opt, idx) => {
                const state = getOptionState(opt, mode, selectedId, showCorrectAnswers)
                const color = LETTER_COLORS[idx % LETTER_COLORS.length]
                const letter = String.fromCharCode(65 + idx)
                const Tag = isInteractive ? 'button' : 'div'

                return (
                    <Tag
                        key={opt.optionId}
                        type={isInteractive ? 'button' : undefined}
                        className={[
                            'mc-option',
                            `mc-option--${state}`,
                            opt.mediaOpsi ? 'mc-option--has-img' : '',
                            isInteractive ? 'mc-option--clickable' : '',
                        ].filter(Boolean).join(' ')}
                        style={{
                            '--mc-bg': color.bg,
                            '--mc-border': color.border,
                            '--mc-letter': color.letter,
                            '--mc-shadow': color.shadow,
                        }}
                        onClick={isInteractive ? () => onSelect?.(opt.optionId) : undefined}
                        disabled={isInteractive ? false : undefined}
                        aria-pressed={isInteractive ? Number(selectedId) === Number(opt.optionId) : undefined}
                    >
                        <span className="mc-option__letter" aria-hidden="true">{letter}</span>
                        {opt.mediaOpsi && (
                            <img
                                src={opt.mediaOpsi}
                                alt={opt.teksOpsi || `Pilihan ${letter}`}
                                className="mc-option__img"
                            />
                        )}
                        <span className="mc-option__text">{opt.teksOpsi}</span>
                        <OptionBadge state={state} />
                    </Tag>
                )
            })}

            {mode === 'review' && !selectedId && (
                <p className="mc-empty-msg">Belum ada jawaban 🙈</p>
            )}
        </div>
    )
}
