const DEFAULT_MAX_MB = 5

/**
 * Validasi file gambar sebelum upload.
 * @returns {string|null} pesan error, atau null jika valid
 */
export function validateImageFile(file, maxMb = DEFAULT_MAX_MB) {
    if (!file) return null
    if (!file.type.startsWith('image/')) {
        return 'File harus berupa gambar (JPG, PNG, WebP, dll.).'
    }
    if (file.size > maxMb * 1024 * 1024) {
        return `Ukuran file maksimal ${maxMb} MB.`
    }
    return null
}

/**
 * Validasi file audio sebelum upload.
 * @returns {string|null} pesan error, atau null jika valid
 */
export function validateAudioFile(file, maxMb = DEFAULT_MAX_MB) {
    if (!file) return null
    if (!file.type.startsWith('audio/')) {
        return 'File harus berupa audio (MP3, WAV, OGG, dll.).'
    }
    if (file.size > maxMb * 1024 * 1024) {
        return `Ukuran file maksimal ${maxMb} MB.`
    }
    return null
}

/** Cek apakah tanggal ISO (YYYY-MM-DD) jatuh di akhir pekan. */
export function isWeekendDate(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return false
    const [y, m, d] = dateStr.split('-').map(Number)
    const jsDay = new Date(y, m - 1, d).getDay()
    return jsDay === 0 || jsDay === 6
}

/** Bangun FormData untuk update/reschedule soal — selalu sertakan scorePoint. */
export function appendQuestionUpdateFields(fd, q, { topicId, learningDate }) {
    fd.append('topicId', topicId)
    fd.append('learningDate', learningDate)
    fd.append('questionType', q.questionType ?? 'QUIZ')
    fd.append('contentInstruction', q.contentInstruction ?? '')
    if (q.timeLimitMinutes != null && q.timeLimitMinutes !== '') {
        fd.append('timeLimitMinutes', q.timeLimitMinutes)
    }
    const score = Number(q.scorePoint)
    if (!score || score <= 0) {
        throw new Error(`Soal #${q.id ?? '?'} tidak memiliki poin skor yang valid.`)
    }
    fd.append('scorePoint', String(score))
}
