import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import {
    IconTrophy, IconMuscle, IconSparkles, IconStar, IconPuzzle, IconParty, IconArrowRight,
} from '../common/AppIcons'
import './PuzzleFeedback.css'

function FeedbackBody({ earned, isCorrect, puzzleCorrectPieces, puzzleTotalPieces }) {
    const isPartial = puzzleTotalPieces > 0
        && puzzleCorrectPieces != null
        && puzzleCorrectPieces > 0
        && puzzleCorrectPieces < puzzleTotalPieces

    return (
        <>
            <div className="pz-feedback__sparkles" aria-hidden="true">
                <IconSparkles size={20} />
                <IconStar size={22} />
                <IconSparkles size={20} />
            </div>
            <div className="pz-feedback__mascot" aria-hidden="true">
                {isCorrect
                    ? <IconTrophy size={56} />
                    : isPartial
                        ? <IconPuzzle size={56} />
                        : <IconMuscle size={56} />}
            </div>
            <h3 className="pz-feedback__title">
                {isCorrect ? 'Berhasil!' : isPartial ? 'Hampir Sempurna!' : 'Sudah Dikirim!'}
            </h3>
            {isPartial && (
                <p className="pz-feedback__puzzle-meta">
                    {puzzleCorrectPieces} dari {puzzleTotalPieces} keping benar
                </p>
            )}
            <div className="pz-feedback__score-box">
                <span className="pz-feedback__score-plus">+</span>
                <span className="pz-feedback__score-num">{earned}</span>
                <span className="pz-feedback__score-label">poin</span>
            </div>
            <p className="pz-feedback__msg">
                {isCorrect
                    ? <>Kamu hebat banget! <IconParty size={16} className="pz-feedback__inline-icon" /></>
                    : isPartial
                        ? <>Skor dihitung dari keping yang benar. Coba lengkapi semua keping untuk poin penuh! <IconMuscle size={16} className="pz-feedback__inline-icon" /></>
                        : <>Tetap semangat ya! Kamu sudah berusaha <IconMuscle size={16} className="pz-feedback__inline-icon" /></>}
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
    puzzleCorrectPieces = null,
    puzzleTotalPieces = null,
    popup = false,
    onNext,
    onClose,
    isLast = false,
    disabled = false,
}) {
    const isPartial = puzzleTotalPieces > 0
        && puzzleCorrectPieces != null
        && puzzleCorrectPieces > 0
        && puzzleCorrectPieces < puzzleTotalPieces

    const inner = (
        <div className={`pz-feedback${isCorrect ? ' pz-feedback--win' : isPartial ? ' pz-feedback--partial' : ' pz-feedback--try'}`}>
            <FeedbackBody
                earned={earned}
                isCorrect={isCorrect}
                puzzleCorrectPieces={puzzleCorrectPieces}
                puzzleTotalPieces={puzzleTotalPieces}
            />
            {popup && onNext && (
                <button
                    type="button"
                    className="pz-popup__next"
                    onClick={onNext}
                    disabled={disabled}
                >
                    {isLast
                        ? <>Lihat Hasil <IconTrophy size={16} /></>
                        : <>Selanjutnya <IconArrowRight size={16} /></>}
                </button>
            )}
        </div>
    )

    if (!popup) return inner

    const handleClose = () => {
        if (disabled) return
        if (onClose) onClose()
        else if (onNext) onNext()
    }

    return createPortal(
        <div className="pz-popup-overlay" role="dialog" aria-modal="true" aria-label="Hasil jawaban">
            <div className="pz-popup-card">
                <button
                    type="button"
                    className="pz-popup__close"
                    onClick={handleClose}
                    disabled={disabled}
                    aria-label="Tutup"
                >
                    <X size={18} />
                </button>
                {inner}
            </div>
        </div>,
        document.body,
    )
}
