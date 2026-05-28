import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { setOnAuthExpired } from '../utils/apiFetch'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [expired, setExpired] = useState(false)
    const timerRef = useRef(null)

    // Decode JWT exp claim (payload is base64url-encoded JSON)
    const getExpiry = (jwt) => {
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
            return payload.exp ? payload.exp * 1000 : null // ms
        } catch {
            return null
        }
    }

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    const doLogout = useCallback(() => {
        clearTimer()
        localStorage.removeItem('token')
        setToken(null)
        setExpired(true)
    }, [])

    const saveToken = useCallback((newToken) => {
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setExpired(false)
    }, [])

    const logout = useCallback(() => {
        setExpired(false)
        doLogout()
    }, [doLogout])

    // Register apiFetch 401 handler
    useEffect(() => {
        setOnAuthExpired(doLogout)
        return () => setOnAuthExpired(null)
    }, [doLogout])

    // Set a timer to auto-logout when token expires
    useEffect(() => {
        clearTimer()
        if (!token) return

        const exp = getExpiry(token)
        if (!exp) return

        const msLeft = exp - Date.now()
        if (msLeft <= 0) {
            doLogout()
            return
        }

        timerRef.current = setTimeout(doLogout, msLeft)
        return clearTimer
    }, [token, doLogout])

    return (
        <AuthContext.Provider value={{ token, isLoggedIn: !!token, expired, saveToken, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
