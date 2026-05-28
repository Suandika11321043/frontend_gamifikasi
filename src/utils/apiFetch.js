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

// ── Shared fetch wrapper ──────────────────────────────────────────
export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }

    _activeCount++
    _notify()

    try {
        const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
        if (res.status === 204) return null
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.')
        return data
    } finally {
        _activeCount--
        _notify()
    }
}
