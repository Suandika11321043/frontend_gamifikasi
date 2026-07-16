import { useState, useEffect } from 'react'
import GeneratedAvatar from './GeneratedAvatar'
import { isGeneratedAvatar } from '../../utils/avatarPresets'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Displays a student avatar image, generated avatar, or coloured initial fallback.
 * Props:
 *   avatar  – generated key | filename | absolute URL | falsy
 *   name    – student name (nameplate / fallback initial)
 *   size    – 'sm' | 'md' | 'lg' | 'xl'  (default 'sm')
 */
function AvatarImg({ avatar, name, size = 'sm', showNameplate = true }) {
    const [blobUrl, setBlobUrl] = useState(null)
    const [failed, setFailed] = useState(false)

    const generated = isGeneratedAvatar(avatar)
    const isAbsolute = !generated && avatar && (
        avatar.startsWith('http://') ||
        avatar.startsWith('https://') ||
        avatar.startsWith('blob:')
    )
    const localSrc = !generated && avatar && !isAbsolute ? `${BASE_URL}/uploads/${avatar}` : null

    useEffect(() => {
        if (!localSrc) {
            setBlobUrl(null)
            setFailed(false)
            return
        }
        let objectUrl = null
        let cancelled = false
        const token = localStorage.getItem('token')
        fetch(localSrc, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((res) => {
                if (!res.ok) throw new Error('failed')
                return res.blob()
            })
            .then((blob) => {
                if (cancelled) return
                objectUrl = URL.createObjectURL(blob)
                setBlobUrl(objectUrl)
                setFailed(false)
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })

        return () => {
            cancelled = true
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [localSrc])

    // Reset failed when avatar URL changes
    useEffect(() => {
        setFailed(false)
    }, [avatar])

    if (generated) {
        return (
            <GeneratedAvatar
                avatarKey={avatar}
                name={name}
                size={size}
                showNameplate={showNameplate}
            />
        )
    }

    const sizeClass = `avatar--${size === 'xl' ? 'lg' : size}`

    if (isAbsolute && !failed) {
        return (
            <img
                src={avatar}
                alt={name}
                className={`avatar-img ${sizeClass}`}
                onError={() => setFailed(true)}
            />
        )
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
