import { useState } from 'react'
import { SortOptionCard } from './SortOptionCard'
import './SortOptionCard.css'

const ROW_MAX = 5

function chunkOrder(order) {
    const rows = []
    for (let i = 0; i < order.length; i += ROW_MAX) {
        rows.push(order.slice(i, i + ROW_MAX))
    }
    return rows
}

function rowItemBasis(count) {
    if (count <= 1) return '100%'
    return `calc((100% - ${(count - 1) * 0.75}rem) / ${count})`
}

/**
 * Tinjau ulang soal urutkan — UI seragam dengan mode kuis, mendukung media & tata letak.
 */
export default function SortingReview({
    options = [],
    orderedOptionIds = [],
    showCorrectOrder = false,
}) {
    const [layout, setLayout] = useState('horizontal')
    const optById = Object.fromEntries(options.map((o) => [o.optionId, o]))
    const correctOrder = [...options]
        .sort((a, b) => (a.urutanBenar ?? 999) - (b.urutanBenar ?? 999))
        .map((o) => o.optionId)

    if (orderedOptionIds.length === 0) {
        return <p className="sr-empty">Belum ada jawaban 🙈</p>
    }

    const isHorizontal = layout === 'horizontal'
    const showCorrect = showCorrectOrder
        && orderedOptionIds.some((id, i) => correctOrder.indexOf(id) !== i)

    const renderList = (ids, keyPrefix = '') => {
        const rows = isHorizontal ? chunkOrder(ids) : [ids]
        if (isHorizontal) {
            return (
                <div className="sorting-rows">
                    {rows.map((rowIds, rowIndex) => (
                        <div
                            key={`${keyPrefix}row-${rowIndex}`}
                            className="sorting-list sorting-list--horizontal"
                            style={{
                                '--sort-cols': rowIds.length,
                                '--sort-item-basis': rowItemBasis(rowIds.length),
                            }}
                        >
                            {rowIds.map((id, colIndex) => {
                                const globalIdx = rowIndex * ROW_MAX + colIndex
                                const opt = optById[id]
                                const expectedAt = correctOrder.indexOf(id)
                                const isOk = keyPrefix === 'correct-' || expectedAt === globalIdx
                                return (
                                    <SortOptionCard
                                        key={`${keyPrefix}${id}`}
                                        opt={opt}
                                        rank={globalIdx + 1}
                                        layout={layout}
                                        state={isOk ? 'ok' : 'bad'}
                                    />
                                )
                            })}
                        </div>
                    ))}
                </div>
            )
        }
        return (
            <div className="sorting-list sorting-list--vertical">
                {ids.map((id, i) => {
                    const opt = optById[id]
                    const expectedAt = correctOrder.indexOf(id)
                    const isOk = keyPrefix === 'correct-' || expectedAt === i
                    return (
                        <SortOptionCard
                            key={`${keyPrefix}${id}`}
                            opt={opt}
                            rank={i + 1}
                            layout={layout}
                            state={isOk ? 'ok' : 'bad'}
                        />
                    )
                })}
            </div>
        )
    }

    return (
        <div className={`sorting-wrap sorting-wrap--${layout} sr-wrap`}>
            <div className="sorting-toolbar">
                <p className="sr-hint">
                    {isHorizontal ? '↦ Urutan jawabanmu' : '↕ Urutan jawabanmu'}
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

            {renderList(orderedOptionIds)}

            {showCorrect && (
                <>
                    <p className="sr-section-title sr-section-title--correct">★ Urutan yang benar</p>
                    {renderList(correctOrder, 'correct-')}
                </>
            )}
        </div>
    )
}
