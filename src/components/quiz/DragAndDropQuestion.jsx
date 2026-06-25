import { useState } from 'react'
import OptionMedia, { getOptionMediaType } from './OptionMedia'

export default function DragAndDropQuestion({ question, answer, onAnswer }) {
    const items = question.options.filter((o) => o.tipeItem === 'JAWABAN')
    const targets = question.options.filter((o) => o.tipeItem === 'PERTANYAAN')
    const dropAnswer = answer || {}
    const [draggedId, setDraggedId] = useState(null)
    const [selectedChipId, setSelectedChipId] = useState(null)
    const [hoveredTarget, setHoveredTarget] = useState(null)

    if (question.options.length === 0) {
        return <p className="quiz-empty-type">Belum ada pilihan untuk soal ini.</p>
    }

    const usedItemIds = Object.values(dropAnswer).flat()

    const placeChip = (chipId, targetId) => {
        const newAnswer = { ...dropAnswer }
        Object.keys(newAnswer).forEach((k) => {
            if (Array.isArray(newAnswer[k])) {
                newAnswer[k] = newAnswer[k].filter((id) => id !== chipId)
                if (newAnswer[k].length === 0) delete newAnswer[k]
            }
        })
        newAnswer[targetId] = [...(newAnswer[targetId] || []), chipId]
        onAnswer(question.questionId, newAnswer)
    }

    const handleDrop = (e, targetId) => {
        e.preventDefault()
        setHoveredTarget(null)
        if (!draggedId) return
        placeChip(draggedId, targetId)
        setDraggedId(null)
    }

    const handleChipTap = (itemId) => {
        setSelectedChipId((prev) => (prev === itemId ? null : itemId))
    }

    const handleTargetTap = (targetId) => {
        if (!selectedChipId) return
        placeChip(selectedChipId, targetId)
        setSelectedChipId(null)
    }

    const removeDropped = (targetId, itemId, e) => {
        e.stopPropagation()
        const newAnswer = { ...dropAnswer }
        newAnswer[targetId] = (newAnswer[targetId] || []).filter((id) => id !== itemId)
        if (newAnswer[targetId].length === 0) delete newAnswer[targetId]
        onAnswer(question.questionId, Object.keys(newAnswer).length > 0 ? newAnswer : undefined)
    }

    const isActive = !!draggedId || !!selectedChipId

    return (
        <div className="dnd2-container">
            <div className={`dnd-instruction${selectedChipId ? ' dnd-instruction--picking' : ''}`}>
                <span className="dnd-instruction__icon">{selectedChipId ? '👉' : '✋'}</span>
                <span className="dnd-instruction__text">
                    {selectedChipId
                        ? <><strong>Ketuk kartu</strong> tujuan di atas!</>
                        : <>Seret atau <strong>ketuk jawaban</strong>, lalu <strong>letakkan ke kartu</strong> yang sesuai</>
                    }
                </span>
            </div>

            <div className="dnd2-targets">
                {targets.map((target) => {
                    const droppedIds = dropAnswer[target.optionId] || []
                    const isHovered = hoveredTarget === target.optionId
                    return (
                        <div
                            key={target.optionId}
                            className={`dnd2-target-card${isHovered ? ' dnd2-target-card--hover' : ''}${isActive ? ' dnd2-target-card--droppable' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setHoveredTarget(target.optionId) }}
                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHoveredTarget(null) }}
                            onDrop={(e) => handleDrop(e, target.optionId)}
                            onClick={() => handleTargetTap(target.optionId)}
                            role="button"
                            tabIndex={selectedChipId ? 0 : -1}
                            aria-label={target.teksOpsi}
                        >
                            {target.mediaOpsi && (
                                <OptionMedia url={target.mediaOpsi} alt={target.teksOpsi} />
                            )}
                            <p className="dnd2-target-label">{target.teksOpsi}</p>
                            {droppedIds.length > 0 && (
                                <div className="dnd2-placed-chips">
                                    {droppedIds.map((dId) => {
                                        const dItem = items.find((i) => i.optionId === dId)
                                        if (!dItem) return null
                                        const dMediaType = dItem.mediaOpsi ? getOptionMediaType(dItem.mediaOpsi) : null
                                        return (
                                            <div key={dId} className={[
                                                'dnd2-placed-chip',
                                                dMediaType === 'image' ? 'dnd2-placed-chip--has-img' : '',
                                                dMediaType === 'audio' ? 'dnd2-placed-chip--has-audio' : '',
                                            ].filter(Boolean).join(' ')}>
                                                {dItem.mediaOpsi && (
                                                    <OptionMedia url={dItem.mediaOpsi} alt={dItem.teksOpsi} />
                                                )}
                                                <span className="dnd2-placed-chip__label">{dItem.teksOpsi}</span>
                                                <button
                                                    className="dnd-remove-btn"
                                                    onClick={(e) => removeDropped(target.optionId, dId, e)}
                                                    aria-label="Hapus"
                                                >✕</button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="dnd2-divider"><span>Pilihan Jawaban</span></div>

            <div className="dnd2-chips">
                {items
                    .filter((i) => !usedItemIds.includes(i.optionId))
                    .map((item) => {
                        const itemMediaType = item.mediaOpsi ? getOptionMediaType(item.mediaOpsi) : null
                        return (
                        <div
                            key={item.optionId}
                            className={[
                                'dnd2-chip',
                                draggedId === item.optionId ? 'dnd2-chip--dragging' : '',
                                selectedChipId === item.optionId ? 'dnd2-chip--selected' : '',
                                itemMediaType === 'image' ? 'dnd2-chip--has-img' : '',
                                itemMediaType === 'audio' ? 'dnd2-chip--has-audio' : '',
                            ].filter(Boolean).join(' ')}
                            draggable
                            onDragStart={() => { setDraggedId(item.optionId); setSelectedChipId(null) }}
                            onDragEnd={() => { setDraggedId(null); setHoveredTarget(null) }}
                            onClick={() => handleChipTap(item.optionId)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleChipTap(item.optionId)}
                        >
                            {item.mediaOpsi && (
                                <OptionMedia url={item.mediaOpsi} alt={item.teksOpsi} />
                            )}
                            <span className="dnd2-chip__label">{item.teksOpsi}</span>
                        </div>
                        )
                    })}
                {items.filter((i) => !usedItemIds.includes(i.optionId)).length === 0 && (
                    <p className="dnd-all-placed">🎉 Semua jawaban sudah ditempatkan!</p>
                )}
            </div>
        </div>
    )
}
