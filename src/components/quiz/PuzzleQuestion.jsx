import { useState, useEffect, useRef, useMemo } from 'react'
import { apiFetch } from '../../utils/apiFetch'
import './PuzzleQuestion.css'

export default function PuzzleQuestion({ question, answer, onAnswer }) {
    const [puzzleData, setPuzzleData] = useState(null)
    const [loadingPuzzle, setLoadingPuzzle] = useState(true)
    const [placements, setPlacements] = useState(() => {
        if (!answer || !Array.isArray(answer)) return {}
        const p = {}
        answer.forEach(({ pieceId, placedPosition }) => { p[placedPosition] = pieceId })
        return p
    })
    const [activePieceId, setActivePieceId] = useState(null)
    const [activeFromSlot, setActiveFromSlot] = useState(null)
    const [hoveredSlot, setHoveredSlot] = useState(null)
    const [progress, setProgress] = useState(null)
    const [lockedSlots, setLockedSlots] = useState(() => new Set())
    const progressTimerRef = useRef(null)
    const restoredProgressRef = useRef(false)

    useEffect(() => {
        setLoadingPuzzle(true)
        apiFetch(`/jigsaw/questions/${question.questionId}/puzzle`)
            .then((data) => setPuzzleData(data))
            .catch(() => setPuzzleData(null))
            .finally(() => setLoadingPuzzle(false))
    }, [question.questionId])

    const pieceMap = Object.fromEntries((puzzleData?.pieces ?? []).map((p) => [p.id, p]))
    const totalSlots = (puzzleData?.gridRows ?? 0) * (puzzleData?.gridCols ?? 0)
    const placedPieceIds = new Set(Object.values(placements))
    const trayPieces = (puzzleData?.pieces ?? []).filter((p) => !placedPieceIds.has(p.id))

    /** Siluet keping per slot (pieceIndex = posisi grid saat puzzle dibuat). */
    const ghostBySlot = useMemo(() => {
        const map = {}
        for (const p of puzzleData?.pieces ?? []) {
            if (p.pieceIndex != null) map[p.pieceIndex] = p
        }
        return map
    }, [puzzleData])

    /** Benar/salah per slot dari API progress (tanpa bocorkan correctPosition). */
    const slotStatus = useMemo(() => {
        const map = {}
        for (const r of progress?.pieceResults ?? []) {
            if (r.placedPosition == null) continue
            map[r.placedPosition] = r.isCorrect === true ? 'ok' : r.isCorrect === false ? 'bad' : null
        }
        return map
    }, [progress])

    const isPieceCorrectAtSlot = (pieceId, slotIdx) => {
        const piece = pieceMap[pieceId]
        return piece?.pieceIndex != null && Number(piece.pieceIndex) === Number(slotIdx)
    }

    const mergeLockedFromResults = (results) => {
        if (!results?.length) return
        setLockedSlots((prev) => {
            const next = new Set(prev)
            for (const r of results) {
                if (r.isCorrect === true && r.placedPosition != null) {
                    next.add(Number(r.placedPosition))
                }
            }
            return next.size === prev.size ? prev : next
        })
    }

    const mergeLockedFromPlacements = (placementsMap) => {
        setLockedSlots((prev) => {
            const next = new Set(prev)
            for (const [slot, pieceId] of Object.entries(placementsMap)) {
                if (isPieceCorrectAtSlot(pieceId, slot)) next.add(Number(slot))
            }
            return next.size === prev.size ? prev : next
        })
    }

    useEffect(() => {
        restoredProgressRef.current = false
        setLockedSlots(new Set())
        setProgress(null)
    }, [question.questionId])

    useEffect(() => {
        if (!puzzleData || restoredProgressRef.current) return
        restoredProgressRef.current = true

        const entries = Object.entries(placements)
        if (entries.length === 0) return

        mergeLockedFromPlacements(Object.fromEntries(entries))
        const arr = entries.map(([slot, pieceId]) => ({
            pieceId: Number(pieceId),
            placedPosition: Number(slot),
        }))
        apiFetch('/jigsaw/progress', {
            method: 'POST',
            body: JSON.stringify({ questionId: question.questionId, placements: arr }),
        })
            .then((res) => {
                setProgress(res)
                mergeLockedFromResults(res?.pieceResults)
            })
            .catch(() => { /* ignore */ })
    }, [puzzleData, question.questionId])

    const commit = (newPlacements) => {
        setPlacements(newPlacements)
        mergeLockedFromPlacements(newPlacements)
        const arr = Object.entries(newPlacements).map(([slot, pieceId]) => ({
            pieceId: Number(pieceId),
            placedPosition: Number(slot),
        }))
        onAnswer(question.questionId, arr)
        if (progressTimerRef.current) clearTimeout(progressTimerRef.current)
        if (arr.length > 0) {
            progressTimerRef.current = setTimeout(async () => {
                try {
                    const res = await apiFetch('/jigsaw/progress', {
                        method: 'POST',
                        body: JSON.stringify({ questionId: question.questionId, placements: arr }),
                    })
                    setProgress(res)
                    mergeLockedFromResults(res?.pieceResults)
                } catch { /* ignore */ }
            }, 400)
        } else {
            setProgress(null)
        }
    }

    const placeOnSlot = (slotIdx) => {
        if (activePieceId == null) return
        if (lockedSlots.has(slotIdx)) return
        if (activeFromSlot !== null && lockedSlots.has(activeFromSlot)) return
        const next = { ...placements }
        if (activeFromSlot !== null) delete next[activeFromSlot]
        if (activeFromSlot !== null && next[slotIdx] !== undefined) {
            next[activeFromSlot] = next[slotIdx]
        }
        next[slotIdx] = activePieceId
        commit(next)
        setActivePieceId(null)
        setActiveFromSlot(null)
        setHoveredSlot(null)
    }

    const returnToTray = () => {
        if (activeFromSlot === null) { setActivePieceId(null); return }
        if (lockedSlots.has(activeFromSlot)) { setActivePieceId(null); setActiveFromSlot(null); return }
        const next = { ...placements }
        delete next[activeFromSlot]
        commit(next)
        setActivePieceId(null)
        setActiveFromSlot(null)
    }

    const handleSlotClick = (slotIdx) => {
        if (lockedSlots.has(slotIdx)) return
        const pieceId = placements[slotIdx]
        if (activePieceId != null) {
            placeOnSlot(slotIdx)
        } else if (pieceId != null) {
            setActivePieceId(pieceId)
            setActiveFromSlot(slotIdx)
        }
    }

    const handlePieceTrayClick = (pieceId) => {
        if (activePieceId === pieceId) {
            setActivePieceId(null)
            setActiveFromSlot(null)
        } else {
            setActivePieceId(pieceId)
            setActiveFromSlot(null)
        }
    }

    if (loadingPuzzle) return <p className="pz-loading">Memuat puzzle...</p>
    if (!puzzleData) return <p className="pz-empty">Puzzle belum tersedia untuk soal ini.</p>

    const allPlaced = trayPieces.length === 0 && totalSlots > 0
    const progressPct = Math.round(progress?.progressPercent ?? progress?.percentage ?? 0)
    const referenceImage = puzzleData.imageUrl || puzzleData.contentImage || question?.contentImage

    return (
        <div className="pz-wrap">
            <p className="pz-hint">
                {activePieceId
                    ? '👉 Ketuk kotak untuk menempatkan keping'
                    : '🧩 Ketuk keping lalu ketuk kotak untuk menyusun puzzle!'}
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
                        style={{
                            '--pz-cols': puzzleData.gridCols,
                            '--pz-rows': puzzleData.gridRows,
                        }}
                    >
                        <div
                            className="pz-grid"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); if (activeFromSlot === null || !lockedSlots.has(activeFromSlot)) returnToTray() }}
                        >
                            {Array.from({ length: totalSlots }, (_, slotIdx) => {
                                const pieceId = placements[slotIdx]
                                const piece = pieceId != null ? pieceMap[pieceId] : null
                                const ghost = ghostBySlot[slotIdx]
                                const status = slotStatus[slotIdx]
                                const isLocked = lockedSlots.has(slotIdx)
                                const isActive = activePieceId != null && activeFromSlot === slotIdx
                                const isHovered = hoveredSlot === slotIdx && !isLocked
                                return (
                                    <div
                                        key={slotIdx}
                                        className={`pz-slot${piece ? ' pz-slot--filled' : ' pz-slot--empty'}${ghost ? ' pz-slot--has-ghost' : ''}${isLocked ? ' pz-slot--locked' : ''}${!isLocked && status === 'bad' ? ' pz-slot--wrong' : ''}${!isLocked && status === 'ok' ? ' pz-slot--right' : ''}${isHovered && activePieceId != null ? ' pz-slot--hover' : ''}${isActive ? ' pz-slot--active' : ''}${activePieceId != null && !piece && !isLocked ? ' pz-slot--droppable' : ''}`}
                                        onDragOver={(e) => { if (isLocked) return; e.preventDefault(); setHoveredSlot(slotIdx) }}
                                        onDragLeave={() => setHoveredSlot(null)}
                                        onDrop={(e) => { e.preventDefault(); if (!isLocked) placeOnSlot(slotIdx) }}
                                        onClick={() => handleSlotClick(slotIdx)}
                                    >
                                        {ghost && !piece && (
                                            <span className="pz-slot-ghost" aria-hidden="true">
                                                <img
                                                    src={ghost.pieceImageUrl}
                                                    alt=""
                                                    className="pz-piece-img"
                                                />
                                            </span>
                                        )}
                                        {piece ? (
                                            <span className={`pz-piece-layer${isLocked ? ' pz-piece-layer--locked' : ''}${!isLocked && status === 'bad' ? ' pz-piece-layer--wrong' : ''}${isLocked || status === 'ok' ? ' pz-piece-layer--right' : ''}`}>
                                                <img
                                                    src={piece.pieceImageUrl}
                                                    alt={`keping ${slotIdx + 1}`}
                                                    className={`pz-piece-img${isLocked ? ' pz-piece-img--locked' : ''}${!isLocked && status === 'bad' ? ' pz-piece-img--wrong' : ''}${isLocked || status === 'ok' ? ' pz-piece-img--right' : ''}`}
                                                    draggable={!isLocked}
                                                    onDragStart={(e) => {
                                                        if (isLocked) { e.preventDefault(); return }
                                                        setActivePieceId(pieceId)
                                                        setActiveFromSlot(slotIdx)
                                                    }}
                                                    onDragEnd={() => { setActivePieceId(null); setActiveFromSlot(null); setHoveredSlot(null) }}
                                                />
                                            </span>
                                        ) : !ghost ? (
                                            <span className="pz-slot-num">{slotIdx + 1}</span>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div
                        className={`pz-tray${activePieceId != null && activeFromSlot !== null ? ' pz-tray--droppable' : ''}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); returnToTray() }}
                        onClick={() => { if (activePieceId != null && activeFromSlot !== null && !lockedSlots.has(activeFromSlot)) returnToTray() }}
                    >
                        <p className="pz-tray-label">
                            {allPlaced ? '🎉 Semua keping sudah dipasang!' : `Keping tersedia (${trayPieces.length})`}
                        </p>
                        <div className="pz-tray-pieces">
                            {trayPieces.map((piece) => (
                                <div
                                    key={piece.id}
                                    className={`pz-piece${activePieceId === piece.id ? ' pz-piece--selected' : ''}`}
                                    draggable
                                    onDragStart={() => { setActivePieceId(piece.id); setActiveFromSlot(null) }}
                                    onDragEnd={() => { setActivePieceId(null); setActiveFromSlot(null) }}
                                    onClick={(e) => { e.stopPropagation(); handlePieceTrayClick(piece.id) }}
                                >
                                    <img src={piece.pieceImageUrl} alt="keping" className="pz-piece-img" />
                                </div>
                            ))}
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
