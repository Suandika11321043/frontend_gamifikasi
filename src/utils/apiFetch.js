export const BASE_URL = import.meta.env.VITE_API_BASE_URL

// ── Loading state manager ─────────────────────────────────────────
let _activeCount = 0
const _subscribers = new Set()

function _notify() {
    _subscribers.forEach((fn) => fn(_activeCount > 0))
}

/** Subscribe to loading state changes. Returns an unsubscribe function. */
export function subscribeLoading(fn) {
    _subscribers.add(fn)
    return () => _subscribers.delete(fn)
}

// ── Auth expiry handler ────────────────────────────────────────────
let _onAuthExpired = null

/** Register a callback invoked when the server returns 401 (token expired). */
export function setOnAuthExpired(fn) {
    _onAuthExpired = fn
}

const STATUS_MESSAGES = {
    400: 'Permintaan tidak valid. Periksa kembali data yang Anda masukkan.',
    403: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
    404: 'Data yang diminta tidak ditemukan.',
    409: 'Data bentrok dengan data yang sudah ada. Periksa kembali input Anda.',
    413: 'Ukuran file melebihi batas maksimal 5 MB.',
    500: 'Terjadi kesalahan pada server. Silakan coba lagi beberapa saat.',
}

const TECHNICAL_ERROR_PATTERN = /can't access property|is null|is undefined|TypeError|ReferenceError|SyntaxError|Failed to fetch|NetworkError|Load failed/i

/**
 * Ambil pesan error yang aman dan formal untuk ditampilkan ke pengguna.
 */
export function getErrorMessage(err, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
    if (!err) return fallback
    if (typeof err === 'string') {
        return TECHNICAL_ERROR_PATTERN.test(err) ? fallback : err
    }
    const msg = err.message
    if (!msg || typeof msg !== 'string') return fallback
    if (TECHNICAL_ERROR_PATTERN.test(msg)) return fallback
    if (msg.startsWith('Error ')) return fallback
    return msg
}

function extractErrorMessage(data, status) {
    const body = data && typeof data === 'object' ? data : {}
    if (body.message) return body.message
    if (body.error) return body.error
    if (body.detail) return body.detail
    if (Array.isArray(body.errors) && body.errors[0]?.defaultMessage) {
        return body.errors[0].defaultMessage
    }
    return STATUS_MESSAGES[status] ?? 'Operasi gagal. Silakan coba lagi.'
}

/** Normalisasi respons API menjadi array (hindari akses .data pada null). */
export function unwrapList(data) {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.data)) return data.data
    return []
}

// ── Shared fetch wrapper ──────────────────────────────────────────
export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token')
    const isFormData = options.body instanceof FormData
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }

    _activeCount++
    _notify()

    try {
        let res
        try {
            res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
        } catch {
            throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.')
        }

        if (res.status === 401) {
            localStorage.removeItem('token')
            _onAuthExpired?.()
            throw new Error('Sesi Anda telah berakhir. Silakan masuk kembali.')
        }

        if (res.status === 204) return null

        const contentType = res.headers.get('content-type') ?? ''
        let data = null
        if (contentType.includes('application/json')) {
            try {
                data = await res.json()
            } catch {
                data = null
            }
        }

        if (!res.ok) {
            throw new Error(extractErrorMessage(data, res.status))
        }

        return data
    } finally {
        _activeCount--
        _notify()
    }
}
