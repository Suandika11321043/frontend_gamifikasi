/**
 * Duplikat soal ke tanggal lain (server menyalin soal + opsi + pasangan + puzzle).
 */
export async function duplicateQuestionToDate(apiFetch, sourceQuestionId, topicId, learningDate) {
    const params = new URLSearchParams({
        topicId: String(topicId),
        learningDate,
    })
    return apiFetch(`/questions/${sourceQuestionId}/duplicate?${params}`, {
        method: 'POST',
    })
}
