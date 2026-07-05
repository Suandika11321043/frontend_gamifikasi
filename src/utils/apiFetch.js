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

function extractErrorMessage(data, status) {
    if (data?.message) return data.message
    if (data?.error) return data.error
    if (data?.detail) return data.detail
    if (Array.isArray(data?.errors) && data.errors[0]?.defaultMessage) {
        return data.errors[0].defaultMessage
    }
    if (status === 400) return 'Permintaan tidak valid.'
    if (status === 404) return 'Data tidak ditemukan.'
    if (status === 409) return 'Konflik data. Periksa kembali input Anda.'
    if (status === 413) return 'Ukuran file melebihi batas maksimal 5MB.'
    if (status >= 500) return 'Terjadi kesalahan server. Silakan coba lagi.'
    return `Error ${status}`
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
            throw new Error('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
        }

        // Token expired / unauthorized → auto-logout
        if (res.status === 401) {
            localStorage.removeItem('token')
            _onAuthExpired?.()
            throw new Error('Sesi telah berakhir. Silakan login kembali.')
        }

        if (res.status === 204) return null

        const contentType = res.headers.get('content-type') ?? ''
        const data = contentType.includes('application/json')
            ? await res.json().catch(() => ({}))
            : {}

        if (!res.ok) {
            throw new Error(extractErrorMessage(data, res.status))
        }
        return data
    } finally {
        _activeCount--
        _notify()
    }
}
