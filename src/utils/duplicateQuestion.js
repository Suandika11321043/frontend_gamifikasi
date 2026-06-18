const NEEDS_RELATION = ['MATCH', 'DRAG_AND_DROP']
const COPIES_OPTIONS = ['QUIZ', 'SORTING', ...NEEDS_RELATION]

async function fetchBlob(url) {
    if (!url) return null
    try {
        const res = await fetch(url)
        if (!res.ok) return null
        return await res.blob()
    } catch {
        return null
    }
}

async function copyPuzzle(apiFetch, sourceQId, newQId) {
    const puzzle = await apiFetch(`/jigsaw/questions/${sourceQId}/puzzle`)
    if (!puzzle?.id) return

    const pfd = new FormData()
    pfd.append('questionId', newQId)
    if (puzzle.gridRows != null) pfd.append('gridRows', puzzle.gridRows)
    if (puzzle.gridCols != null) pfd.append('gridCols', puzzle.gridCols)
    if (puzzle.imageUrl) {
        const blob = await fetchBlob(puzzle.imageUrl)
        if (blob) pfd.append('image', blob, 'puzzle-image')
    }
    const newPuzzle = await apiFetch('/jigsaw/puzzles', { method: 'POST', body: pfd })
    if (!newPuzzle?.id) return

    const pieces = await apiFetch(`/jigsaw/puzzles/${puzzle.id}/pieces`)
    const pieceList = Array.isArray(pieces) ? pieces : []
    for (const piece of pieceList) {
        const pcfd = new FormData()
        if (piece.pieceIndex != null) pcfd.append('pieceIndex', piece.pieceIndex)
        if (piece.correctPosition != null) pcfd.append('correctPosition', piece.correctPosition)
        if (piece.pieceImageUrl) {
            const blob = await fetchBlob(piece.pieceImageUrl)
            if (blob) pcfd.append('image', blob, `piece-${piece.pieceIndex}`)
        }
        await apiFetch(`/jigsaw/puzzles/${newPuzzle.id}/pieces`, { method: 'POST', body: pcfd })
    }
}

async function copyOptions(apiFetch, sourceQ, newQId) {
    const idMap = {}
    const qType = sourceQ.questionType ?? 'QUIZ'
    const opts = await apiFetch(`/question-options/question/${sourceQ.id}`)
    const optList = Array.isArray(opts) ? opts : []

    for (const opt of optList) {
        const ofd = new FormData()
        ofd.append('questionId', newQId)
        ofd.append('teksOpsi', opt.teksOpsi ?? '')
        if (qType === 'QUIZ') ofd.append('kunciJawaban', opt.kunciJawaban ? 'true' : 'false')
        if (qType === 'SORTING' && opt.urutanBenar != null) ofd.append('urutanBenar', opt.urutanBenar)
        if (NEEDS_RELATION.includes(qType) && opt.tipeItem) ofd.append('tipeItem', opt.tipeItem)
        if (opt.mediaOpsi) {
            const blob = await fetchBlob(opt.mediaOpsi)
            if (blob) ofd.append('mediaOpsi', blob, 'media')
        }
        const created = await apiFetch('/question-options', { method: 'POST', body: ofd })
        const oldId = opt.id != null ? Number(opt.id) : null
        const newId = created?.id != null ? Number(created.id) : null
        if (oldId != null && newId != null) idMap[oldId] = newId
    }

    return idMap
}

async function copyRelations(apiFetch, sourceQId, newQId, idMap) {
    const rels = await apiFetch(`/matching-relations/question/${sourceQId}`)
    const relList = Array.isArray(rels) ? rels : []

    for (const rel of relList) {
        const newLeft = idMap[Number(rel.opsiPertanyaanId)]
        const newRight = idMap[Number(rel.opsiJawabanId)]
        if (!newLeft || !newRight) continue
        await apiFetch('/matching-relations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionId: newQId,
                opsiPertanyaanId: newLeft,
                opsiJawabanId: newRight,
            }),
        })
    }
}

/** Salin opsi / pasangan / puzzle dari soal sumber ke soal baru. */
export async function copyQuestionAttachments(apiFetch, sourceQ, newQId) {
    if (!sourceQ?.id || !newQId) return

    const qType = sourceQ.questionType ?? 'QUIZ'

    try {
        if (qType === 'PUZZLE') {
            await copyPuzzle(apiFetch, sourceQ.id, newQId)
            return
        }

        if (!COPIES_OPTIONS.includes(qType)) return

        const idMap = await copyOptions(apiFetch, sourceQ, newQId)
        if (NEEDS_RELATION.includes(qType)) {
            await copyRelations(apiFetch, sourceQ.id, newQId, idMap)
        }
    } catch {
        // Lewati jika salin lampiran gagal — soal utama tetap tersimpan
    }
}

export async function buildDuplicateQuestionFormData(q, topicId, learningDate) {
    const fd = new FormData()
    fd.append('topicId', topicId)
    fd.append('learningDate', learningDate)
    fd.append('questionType', q.questionType ?? 'QUIZ')
    fd.append('contentInstruction', q.contentInstruction ?? '')
    if (q.timeLimitMinutes) fd.append('timeLimitMinutes', q.timeLimitMinutes)
    if (q.scorePoint) fd.append('scorePoint', q.scorePoint)
    if (q.contentImage) {
        const blob = await fetchBlob(q.contentImage)
        if (blob) fd.append('contentImage', blob, 'image')
    }
    return fd
}
