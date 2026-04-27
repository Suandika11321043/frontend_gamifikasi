import { useState, useCallback } from 'react'

export function useAuth() {
    const [token, setToken] = useState(() => localStorage.getItem('token'))

    const saveToken = useCallback((newToken) => {
        localStorage.setItem('token', newToken)
        setToken(newToken)
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem('token')
        setToken(null)
    }, [])

    return {
        token,
        isLoggedIn: !!token,
        saveToken,
        logout,
    }
}
