export const QUESTION_TYPES = [
    { value: 'QUIZ', label: 'PILIHAN GANDA', color: '#1d4ed8', bg: '#eff6ff' },
    { value: 'MATCH', label: 'MENCOCOKKAN', color: '#166534', bg: '#f0fdf4' },
    { value: 'SORTING', label: 'MENGURUTKAN', color: '#92400e', bg: '#fffbeb' },
    { value: 'DRAG_AND_DROP', label: 'SERET DAN LETAKKAN', color: '#6b21a8', bg: '#faf5ff' },
    { value: 'PUZZLE', label: 'PUZZLE', color: '#a8a121', bg: '#fafde7' },
]

const TYPE_ALIASES = {
    MULTIPLE_CHOICE: 'QUIZ',
    MATCHING: 'MATCH',
    ORDERING: 'SORTING',
}

export function getQuestionTypeConfig(type) {
    const normalized = TYPE_ALIASES[type] ?? type
    return QUESTION_TYPES.find((t) => t.value === normalized)
        ?? { value: type, label: type ?? '—', color: '#374151', bg: '#f3f4f6' }
}
