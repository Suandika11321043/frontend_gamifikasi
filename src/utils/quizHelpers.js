export function isAnswered(q, answers) {
    const a = answers[q.questionId]
    if (a === undefined || a === null) return false
    switch (q.questionType) {
        case 'QUIZ':
            return typeof a === 'number'
        case 'MATCH': {
            const pertanyaan = q.options.filter((o) => o.tipeItem === 'PERTANYAAN')
            if (pertanyaan.length === 0) return false
            return pertanyaan.every((p) => a[p.optionId] !== undefined)
        }
        case 'SORTING':
            return Array.isArray(a) && a.length > 0
        case 'DRAG_AND_DROP': {
            const targets = q.options.filter((o) => o.tipeItem === 'PERTANYAAN')
            if (targets.length === 0) return true
            return targets.every((t) => Array.isArray(a[t.optionId]) && a[t.optionId].length > 0)
        }
        case 'PUZZLE':
            return Array.isArray(a) && a.length > 0
        default:
            return !!a
    }
}
