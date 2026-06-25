export const QUESTION_TYPES = [
    { value: 'QUIZ', label: 'Quiz', color: '#1d4ed8', bg: '#eff6ff' },
    { value: 'MATCH', label: 'Pasangkan', color: '#166534', bg: '#f0fdf4' },
    { value: 'SORTING', label: 'Urutkan', color: '#92400e', bg: '#fffbeb' },
    { value: 'DRAG_AND_DROP', label: 'Drag & Drop', color: '#6b21a8', bg: '#faf5ff' },
    { value: 'PUZZLE', label: 'Puzzle', color: '#a8a121', bg: '#fafde7' },
]

export function getQuestionTypeConfig(type) {
    return QUESTION_TYPES.find((t) => t.value === type)
        ?? { value: type, label: type ?? '—', color: '#374151', bg: '#f3f4f6' }
}
