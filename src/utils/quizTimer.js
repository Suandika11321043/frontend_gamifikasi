const SAVE_INTERVAL_MS = 5000

export function getTimerStorageKey(studentId, scopeId, questionId) {
    return `quiz_timer_${studentId}_${scopeId}_${questionId}`
}

/** Hitung sisa waktu aktual dari data server (elapsed sejak updatedAt). */
export function computeRemainingFromServer(timerDto, limitSeconds) {
    if (!timerDto || timerDto.remainingSeconds == null) return null
    const updatedAt = timerDto.updatedAt ? new Date(timerDto.updatedAt).getTime() : Date.now()
    const elapsed = Math.floor((Date.now() - updatedAt) / 1000)
    return Math.max(0, timerDto.remainingSeconds - elapsed)
}

export async function fetchTimerFromServer(apiFetch, studentId, topicId, questionId) {
    try {
        return await apiFetch(`/quiz/timer/${studentId}/${topicId}/${questionId}`)
    } catch {
        return null
    }
}

export async function saveTimerToServer(apiFetch, { studentId, topicId, questionId, remainingSeconds }) {
    return apiFetch('/quiz/timer', {
        method: 'POST',
        body: JSON.stringify({
            studentId: Number(studentId),
            topicId: Number(topicId),
            questionId: Number(questionId),
            remainingSeconds,
        }),
    })
}

export async function clearTimerOnServer(apiFetch, studentId, topicId, questionId) {
    return apiFetch(`/quiz/timer/${studentId}/${topicId}/${questionId}`, { method: 'DELETE' }).catch(() => {})
}

export async function clearAllTimersOnServer(apiFetch, studentId, topicId) {
    return apiFetch(`/quiz/timer/${studentId}/${topicId}`, { method: 'DELETE' }).catch(() => {})
}

export function readLocalTimer(storageKey, limitSeconds) {
    const saved = sessionStorage.getItem(storageKey)
    const savedTime = saved ? parseInt(saved, 10) : NaN
    if (!isNaN(savedTime) && savedTime > 0 && savedTime <= limitSeconds) return savedTime
    return null
}

export function writeLocalTimer(storageKey, remainingSeconds) {
    sessionStorage.setItem(storageKey, String(remainingSeconds))
}

export function clearLocalTimers(studentId, scopeId) {
    const prefix = `quiz_timer_${studentId}_${scopeId}_`
    Object.keys(sessionStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => sessionStorage.removeItem(k))
}

export { SAVE_INTERVAL_MS }
