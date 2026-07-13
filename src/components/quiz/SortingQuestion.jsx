import { useState } from 'react'
import { SortOptionCard } from './SortOptionCard'
import { shuffleArray } from '../../utils/shuffleArray'
import { IconHand } from '../common/AppIcons'
import './SortOptionCard.css'

const ROW_MAX = 5

function chunkOrder(order) {
    const rows = []
    for (let i = 0; i < order.length; i += ROW_MAX) {
        rows.push(order.slice(i, i + ROW_MAX))
    }
    return rows
}

/** Lebar tiap kartu dalam satu baris horizontal */
function rowItemBasis(count) {
    if (count <= 1) return '100%'
    return `calc((100% - ${(count - 1) * 0.75}rem) / ${count})`
}

export default function SortingQuestion({ question, answer, onAnswer }) {
    const [order, setOrder] = useState(() => {
        if (answer?.length) return answer
        return shuffleArray(question.options.map((o) => o.optionId))
    })
    const [draggingIdx, setDraggingIdx] = useState(null)
    const [layout, setLayout] = useState('horizontal')
    const optionMap = Object.fromEntries(question.options.map((o) => [o.optionId, o]))

    const handleDragStart = (_e, idx) => {
        setDraggingIdx(idx)
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

    const isHorizontal = layout === 'horizontal'
    const rows = isHorizontal ? chunkOrder(order) : [order]

    const renderCard = (optId, idx) => (
        <SortOptionCard
            key={optId}
            opt={optionMap[optId]}
            rank={idx + 1}
            layout={layout}
            draggable
            dragging={draggingIdx === idx}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onMovePrev={() => moveItem(idx, -1)}
            onMoveNext={() => moveItem(idx, 1)}
            canMovePrev={idx > 0}
            canMoveNext={idx < order.length - 1}
        />
    )

    return (
        <div className={`sorting-wrap sorting-wrap--${layout}`}>
            <div className="sorting-toolbar">
                <p className="sorting-hint">
                    {isHorizontal
                        ? <><IconHand size={16} /> Seret kartu atau tekan ◀ ▶ untuk mengurutkan</>
                        : <><IconHand size={16} /> Seret kartu atau tekan ▲ ▼ untuk mengurutkan</>}
                </p>
                <div className="sorting-layout-toggle" role="group" aria-label="Tata letak urutan">
                    <button
                        type="button"
                        className={`sorting-layout-btn${layout === 'horizontal' ? ' sorting-layout-btn--active' : ''}`}
                        onClick={() => setLayout('horizontal')}
                        aria-pressed={layout === 'horizontal'}
                    >
                        ↔ Horizontal
                    </button>
                    <button
                        type="button"
                        className={`sorting-layout-btn${layout === 'vertical' ? ' sorting-layout-btn--active' : ''}`}
                        onClick={() => setLayout('vertical')}
                        aria-pressed={layout === 'vertical'}
                    >
                        ↕ Vertikal
                    </button>
                </div>
            </div>
            {isHorizontal ? (
                <div className="sorting-rows">
                    {rows.map((rowIds, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="sorting-list sorting-list--horizontal"
                            style={{
                                '--sort-cols': rowIds.length,
                                '--sort-item-basis': rowItemBasis(rowIds.length),
                            }}
                        >
                            {rowIds.map((optId, colIndex) => renderCard(optId, rowIndex * ROW_MAX + colIndex))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="sorting-list sorting-list--vertical">
                    {order.map((optId, idx) => renderCard(optId, idx))}
                </div>
            )}
        </div>
    )
}
