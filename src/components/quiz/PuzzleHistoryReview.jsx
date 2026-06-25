import { useState, useEffect, useMemo } from 'react'
import { apiFetch } from '../../utils/apiFetch'
import './PuzzleQuestion.css'

function toNumId(v) {
    if (v == null || v === '') return null
    const n = Number(v)
    return Number.isNaN(n) ? v : n
}

function buildSlotMap(review, fallbackPlacements, puzzlePieces) {
    const slotMap = {}
    const pieceById = Object.fromEntries((puzzlePieces ?? []).map((p) => [p.id, p]))

    if (review?.pieces?.length) {
        review.pieces.forEach((p) => {
            if (p.studentPlacedPosition != null) {
                slotMap[p.studentPlacedPosition] = {
                    pieceId: p.pieceId,
                    pieceImageUrl: p.pieceImageUrl,
                    correct: p.correct === true,
                }
            }
        })
    } else if (fallbackPlacements.length > 0) {
        fallbackPlacements.forEach((pl) => {
            const pieceId = toNumId(pl.pieceId)
            const pos = toNumId(pl.placedPosition)
            const piece = pieceById[pieceId]
            if (pos != null && piece) {
                slotMap[pos] = {
                    pieceId: piece.id,
                    pieceImageUrl: piece.pieceImageUrl,
                    correct: piece.correctPosition === pos,
                }
            }
        })
    }

    return slotMap
}

/**
 * Tinjau ulang jawaban puzzle siswa (read-only) — layout sama seperti mode mengerjakan.
 */
export default function PuzzleHistoryReview({
    studentId,
    questionId,
    fallbackPlacements = [],
    contentImage = null,
    earnedScore = null,
}) {
    const [review, setReview] = useState(null)
    const [puzzle, setPuzzle] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        Promise.all([
            apiFetch(`/jigsaw/students/${studentId}/questions/${questionId}/review`).catch(() => null),
            apiFetch(`/jigsaw/questions/${questionId}/puzzle`).catch(() => null),
        ])
            .then(([reviewData, puzzleData]) => {
                if (cancelled) return
                setReview(reviewData)
                setPuzzle(puzzleData)
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [studentId, questionId])

    const gridRows = review?.gridRows ?? puzzle?.gridRows ?? 3
    const gridCols = review?.gridCols ?? puzzle?.gridCols ?? 3
    const totalSlots = gridRows * gridCols
    const puzzlePieces = puzzle?.pieces ?? []

    const referenceImage = review?.imageUrl
        ?? puzzle?.imageUrl
        ?? puzzle?.contentImage
        ?? contentImage
        ?? null

    const slotMap = useMemo(
        () => buildSlotMap(review, fallbackPlacements, puzzlePieces),
        [review, fallbackPlacements, puzzlePieces],
    )

    const placedPieceIds = useMemo(
        () => new Set(Object.values(slotMap).map((p) => p.pieceId).filter((id) => id != null)),
        [slotMap],
    )

    const trayPieces = useMemo(
        () => puzzlePieces.filter((p) => !placedPieceIds.has(p.id)),
        [puzzlePieces, placedPieceIds],
    )

    const placedCount = Object.keys(slotMap).length
    const totalPieces = review?.totalPieces ?? puzzlePieces.length ?? totalSlots
    const correctCount = review?.correctPiecesCount
        ?? Object.values(slotMap).filter((p) => p.correct).length
    const progressPct = totalPieces > 0 ? Math.round((correctCount / totalPieces) * 100) : 0

    if (loading) return <p className="pz-loading">Memuat jawaban puzzle...</p>

    if (!puzzle && !review) {
        return <p className="pz-empty">Puzzle belum tersedia untuk soal ini.</p>
    }

    return (
        <div className="pz-wrap pz-wrap--review">
            <p className="pz-hint">
                {placedCount === 0
                    ? '🧩 Belum ada keping yang dipasang'
                    : `🧩 ${correctCount} dari ${totalPieces} keping benar`}
            </p>

            <div className={`pz-workspace${referenceImage ? '' : ' pz-workspace--no-ref'}`}>
                {referenceImage && (
                    <aside className="pz-sidebar pz-sidebar--left">
                        <div className="pz-reference">
                            <p className="pz-reference__label">🖼 Gambar Asli</p>
                            <img
                                src={referenceImage}
                                alt="Gambar puzzle asli"
                                className="pz-reference__img"
                            />
                        </div>
                    </aside>
                )}

                <div className="pz-main">
                    <div
                        className="pz-board"
                        style={{ '--pz-cols': gridCols, '--pz-rows': gridRows }}
                    >
                        <div className="pz-grid">
                            {Array.from({ length: totalSlots }, (_, slotIdx) => {
                                const placed = slotMap[slotIdx]
                                const filled = !!placed?.pieceImageUrl
                                return (
                                    <div
                                        key={slotIdx}
                                        className={[
                                            'pz-slot',
                                            filled ? 'pz-slot--filled pz-slot--review' : '',
                                            filled ? (placed.correct ? 'pz-slot--ok' : 'pz-slot--bad') : '',
                                        ].filter(Boolean).join(' ')}
                                    >
                                        {filled ? (
                                            <span className="pz-piece-layer">
                                                <img
                                                    src={placed.pieceImageUrl}
                                                    alt={`keping ${slotIdx + 1}`}
                                                    className="pz-piece-img"
                                                />
                                            </span>
                                        ) : (
                                            <span className="pz-slot-num">{slotIdx + 1}</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="pz-tray pz-tray--readonly">
                        <p className="pz-tray-label">
                            {placedCount === 0
                                ? `Keping tersedia (${trayPieces.length})`
                                : trayPieces.length === 0
                                    ? '🎉 Semua keping sudah dipasang!'
                                    : `Keping belum dipasang (${trayPieces.length})`}
                        </p>
                        <div className="pz-tray-pieces">
                            {trayPieces.length === 0 && placedCount === 0 && puzzlePieces.length === 0 ? (
                                <span className="pz-tray-empty">—</span>
                            ) : (
                                trayPieces.map((piece) => (
                                    <div key={piece.id} className="pz-piece pz-piece--readonly">
                                        <img
                                            src={piece.pieceImageUrl}
                                            alt="keping"
                                            className="pz-piece-img"
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <aside className="pz-sidebar pz-sidebar--right">
                    <div className="pz-progress-side">
                        <span className="pz-progress-side__label">🎯 Progres</span>
                        <div className="pz-progress-side__track">
                            <div
                                className="pz-progress-side__fill"
                                style={{ height: `${progressPct}%`, width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="pz-progress-side__pct">{progressPct}%</span>
                    </div>
                </aside>
            </div>
        </div>
    )
}
