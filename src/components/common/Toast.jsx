import { useState, useCallback, useEffect, useRef } from 'react'
import '../../styles/Toast.css'

/**
 * useToast – returns { showToast, ToastContainer }
 *
 * showToast(message, type?) – type: 'error' | 'success' | 'info'  (default 'error')
 * Toasts auto-dismiss after 3.5 s. Multiple toasts stack vertically.
 */
export function useToast() {
    const [toasts, setToasts] = useState([])
    const idRef = useRef(0)

    const showToast = useCallback((message, type = 'error') => {
        const id = ++idRef.current
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3500)
    }, [])

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    function ToastContainer() {
        if (toasts.length === 0) return null
        return (
            <div className="toast-container" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast--${t.type}`} role="alert">
                        <span className="toast-msg">{t.message}</span>
                        <button
                            type="button"
                            className="toast-close"
                            onClick={() => dismiss(t.id)}
                            aria-label="Tutup notifikasi"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        )
    }

    return { showToast, ToastContainer }
}
