import { createPortal } from 'react-dom'
import './PuzzleFeedback.css'

const MASCOTS = { win: '🏆', try: '💪' }

function FeedbackBody({ earned, isCorrect }) {
    return (
        <>
            <div className="pz-feedback__sparkles" aria-hidden="true">
                <span>✨</span><span>⭐</span><span>✨</span>
            </div>
            <div className="pz-feedback__mascot" aria-hidden="true">
                {isCorrect ? MASCOTS.win : MASCOTS.try}
            </div>
            <h3 className="pz-feedback__title">
                {isCorrect ? 'Berhasil!' : 'Sudah Dikirim!'}
            </h3>
            <div className="pz-feedback__score-box">
                <span className="pz-feedback__score-plus">+</span>
                <span className="pz-feedback__score-num">{earned}</span>
                <span className="pz-feedback__score-label">poin</span>
            </div>
            <p className="pz-feedback__msg">
                {isCorrect
                    ? 'Kamu hebat banget! 🎉'
                    : 'Tetap semangat ya! Kamu sudah berusaha 💪'}
            </p>
        </>
    )
}

/**
 * Popup feedback setelah jawaban — overlay di atas layar soal.
 */
export default function QuizFeedbackPopup({
    earned = 0,
    isCorrect = false,
    popup = false,
    onNext,
    isLast = false,
    disabled = false,
}) {
    const inner = (
        <div className={`pz-feedback${isCorrect ? ' pz-feedback--win' : ' pz-feedback--try'}`}>
            <FeedbackBody earned={earned} isCorrect={isCorrect} />
            {popup && onNext && (
                <button
                    type="button"
                    className="pz-popup__next"
                    onClick={onNext}
                    disabled={disabled}
                >
                    {isLast ? 'Lihat Hasil 🏆' : 'Selanjutnya →'}
                </button>
            )}
        </div>
    )

    if (!popup) return inner

    return createPortal(
        <div className="pz-popup-overlay" role="presentation">
            <div className="pz-popup" role="dialog" aria-modal="true" aria-label="Hasil jawaban">
                {inner}
            </div>
        </div>,
        document.body,
    )
}
