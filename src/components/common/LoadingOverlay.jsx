import { useState, useEffect } from 'react'
import { subscribeLoading } from '../../utils/apiFetch'
import '../../styles/LoadingOverlay.css'

export default function LoadingOverlay() {
    const [visible, setVisible] = useState(false)

    useEffect(() => subscribeLoading(setVisible), [])

    if (!visible) return null

    return (
        <div className="loading-overlay" aria-live="polite" aria-label="Memuat...">
            <div className="loading-overlay__box">
                <div className="loading-overlay__spinner" />
                <p className="loading-overlay__text">Memuat...</p>
            </div>
        </div>
    )
}
