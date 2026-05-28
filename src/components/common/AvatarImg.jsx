import { useState, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Displays a student avatar image, or a coloured initial-letter circle as fallback.
 * Props:
 *   avatar  – filename (served via /uploads/) or absolute URL or falsy
 *   name    – student name for the fallback initial
 *   size    – 'sm' | 'md' | 'lg'  (default 'sm')
 */
function AvatarImg({ avatar, name, size = 'sm' }) {
    const [blobUrl, setBlobUrl] = useState(null)
    const [failed, setFailed] = useState(false)

    const isAbsolute = avatar && (
        avatar.startsWith('http://') ||
        avatar.startsWith('https://') ||
        avatar.startsWith('blob:')
    )
    const localSrc = avatar && !isAbsolute ? `${BASE_URL}/uploads/${avatar}` : null

    useEffect(() => {
        if (!localSrc) return
        let objectUrl = null
        const token = localStorage.getItem('token')
        fetch(localSrc, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((res) => {
                if (!res.ok) throw new Error('failed')
                return res.blob()
            })
            .then((blob) => {
                objectUrl = URL.createObjectURL(blob)
                setBlobUrl(objectUrl)
            })
            .catch(() => setFailed(true))

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [localSrc])

    const sizeClass = `avatar--${size}`

    if (isAbsolute) {
        return <img src={avatar} alt={name} className={`avatar-img ${sizeClass}`} />
    }

    if (localSrc && blobUrl && !failed) {
        return <img src={blobUrl} alt={name} className={`avatar-img ${sizeClass}`} />
    }

    return (
        <div className={`avatar-initials ${sizeClass}`}>
            {(name ?? '?').charAt(0).toUpperCase()}
        </div>
    )
}

export default AvatarImg
