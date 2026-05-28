import { useState } from 'react'

export default function SortingQuestion({ question, answer, onAnswer }) {
    const [order, setOrder] = useState(() => answer || question.options.map((o) => o.optionId))
    const [draggingIdx, setDraggingIdx] = useState(null)
    const optionMap = Object.fromEntries(question.options.map((o) => [o.optionId, o]))

    const handleDragStart = (e, idx) => {
        setDraggingIdx(idx)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e, idx) => {
        e.preventDefault()
        if (draggingIdx === null || draggingIdx === idx) return
        const newOrder = [...order]
        const [moved] = newOrder.splice(draggingIdx, 1)
        newOrder.splice(idx, 0, moved)
        setDraggingIdx(idx)
        setOrder(newOrder)
    }

    const handleDragEnd = () => {
        setDraggingIdx(null)
        onAnswer(question.questionId, order)
    }

    const moveItem = (idx, dir) => {
        const newIdx = idx + dir
        if (newIdx < 0 || newIdx >= order.length) return
        const newOrder = [...order]
            ;[newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]]
        setOrder(newOrder)
        onAnswer(question.questionId, newOrder)
    }

    return (
        <div className="sorting-wrap">
            <p className="sorting-hint">✋ Seret atau tekan ← → untuk mengurutkan</p>
            <div className="sorting-track">
                {order.map((optId, idx) => (
                    <div
                        key={optId}
                        className={`sort-card ${draggingIdx === idx ? 'sort-card--dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="sort-card__media">
                            {optionMap[optId]?.mediaOpsi
                                ? <img src={optionMap[optId].mediaOpsi} alt={optionMap[optId].teksOpsi} className="sort-card__img" />
                                : <div className="sort-card__no-img">🖼</div>
                            }
                            <span className="sort-card__badge">{idx + 1}</span>
                        </div>
                        <div className="sort-card__footer">
                            <button
                                className="sort-card__btn sort-card__btn--l"
                                onClick={() => moveItem(idx, -1)}
                                disabled={idx === 0}
                                aria-label="Pindah ke kiri"
                            >←</button>
                            <span className="sort-card__label">{optionMap[optId]?.teksOpsi}</span>
                            <button
                                className="sort-card__btn sort-card__btn--r"
                                onClick={() => moveItem(idx, 1)}
                                disabled={idx === order.length - 1}
                                aria-label="Pindah ke kanan"
                            >→</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
