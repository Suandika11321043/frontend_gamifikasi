import OptionMedia, { getOptionMediaType } from './OptionMedia'
import './SortOptionCard.css'

const SORT_COLORS = [
    { bg: '#fef9c3', border: '#fbbf24', badge: '#d97706' },
    { bg: '#dbeafe', border: '#60a5fa', badge: '#2563eb' },
    { bg: '#dcfce7', border: '#4ade80', badge: '#16a34a' },
    { bg: '#fce7f3', border: '#f472b6', badge: '#db2777' },
    { bg: '#ede9fe', border: '#a78bfa', badge: '#7c3aed' },
    { bg: '#ffedd5', border: '#fb923c', badge: '#ea580c' },
]

export function SortOptionCard({
    opt,
    rank,
    layout = 'vertical',
    state = 'idle',
    draggable = false,
    onDragStart,
    onDragOver,
    onDragEnd,
    onMovePrev,
    onMoveNext,
    canMovePrev = false,
    canMoveNext = false,
    dragging = false,
    // legacy aliases
    onMoveLeft,
    onMoveRight,
    canMoveLeft,
    canMoveRight,
}) {
    const isHorizontal = layout === 'horizontal'
    const movePrev = onMovePrev ?? onMoveLeft
    const moveNext = onMoveNext ?? onMoveRight
    const canPrev = onMovePrev != null ? canMovePrev : canMoveLeft
    const canNext = onMoveNext != null ? canMoveNext : canMoveRight
    const color = SORT_COLORS[(rank - 1) % SORT_COLORS.length]
    const hasMedia = !!opt?.mediaOpsi
    const mediaType = hasMedia ? getOptionMediaType(opt.mediaOpsi) : null
    const hasText = !!(opt?.teksOpsi && opt.teksOpsi.trim())
    const contentType = hasMedia ? 'media' : 'text'

    return (
        <div
            className={[
                'soc-card',
                `soc-card--${state}`,
                `soc-card--${contentType}`,
                mediaType === 'image' ? 'soc-card--has-image' : '',
                hasMedia ? 'soc-card--has-media' : '',
                mediaType === 'audio' ? 'soc-card--has-audio' : '',
                dragging ? 'soc-card--dragging' : '',
                isHorizontal ? 'soc-card--layout-horizontal' : 'soc-card--layout-vertical',
            ].filter(Boolean).join(' ')}
            style={{
                '--soc-bg': color.bg,
                '--soc-border': color.border,
                '--soc-badge': color.badge,
            }}
            draggable={draggable}
            onDragStart={(e) => {
                if (e.target.closest('.option-media--audio, audio, .option-media__player')) {
                    e.preventDefault()
                    return
                }
                onDragStart?.(e)
            }}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="soc-card__rank">
                <span className="soc-card__rank-num">{rank}</span>
                {draggable && <span className="soc-card__grip" aria-hidden="true">⠿</span>}
            </div>

            <div className="soc-card__body">
                {hasMedia ? (
                    <OptionMedia
                        url={opt.mediaOpsi}
                        alt={opt.teksOpsi || `Urutan ${rank}`}
                    />
                ) : (
                    !isHorizontal && <div className="soc-card__icon" aria-hidden="true">📋</div>
                )}
                {hasText && <p className="soc-card__text">{opt.teksOpsi}</p>}
            </div>

            {draggable && (
                <div className={`soc-card__actions${isHorizontal ? ' soc-card__actions--horizontal' : ''}`}>
                    <button
                        type="button"
                        className="soc-card__btn soc-card__btn--prev"
                        onClick={movePrev}
                        disabled={!canPrev}
                        aria-label={isHorizontal ? 'Pindah ke kiri' : 'Pindah ke atas'}
                    >{isHorizontal ? '◀' : '▲'}</button>
                    <button
                        type="button"
                        className="soc-card__btn soc-card__btn--next"
                        onClick={moveNext}
                        disabled={!canNext}
                        aria-label={isHorizontal ? 'Pindah ke kanan' : 'Pindah ke bawah'}
                    >{isHorizontal ? '▶' : '▼'}</button>
                </div>
            )}

            {state === 'ok' && <span className="soc-card__status soc-card__status--ok">✓</span>}
            {state === 'bad' && <span className="soc-card__status soc-card__status--bad">✗</span>}
        </div>
    )
}

export { SORT_COLORS }
