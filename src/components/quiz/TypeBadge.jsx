const TYPE_LABELS = {
    QUIZ: { label: 'Pilihan Ganda', icon: '🅰', color: 'badge--quiz' },
    MATCH: { label: 'Cocokkan', icon: '🔗', color: 'badge--match' },
    SORTING: { label: 'Urutkan', icon: '↕', color: 'badge--sort' },
    DRAG_AND_DROP: { label: 'Seret & Lepas', icon: '✋', color: 'badge--dnd' },
    PUZZLE: { label: 'Puzzle', icon: '🧩', color: 'badge--puzzle' },
}

export default function TypeBadge({ type }) {
    const meta = TYPE_LABELS[type] || { label: type, icon: '❓', color: '' }
    return (
        <span className={`question-type-badge ${meta.color}`}>
            {meta.icon} {meta.label}
        </span>
    )
}
