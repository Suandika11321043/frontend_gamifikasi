const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function login(username, password) {
    let response
    try {
        response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        })
    } catch {
        throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.')
    }

    let data = null
    try {
        data = await response.json()
    } catch {
        data = null
    }

    if (!response.ok) {
        const body = data && typeof data === 'object' ? data : {}
        throw new Error(
            body.message
            || body.error
            || 'Nama pengguna atau kata sandi tidak valid.'
        )
    }

    return data
}
