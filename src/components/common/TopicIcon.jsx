import { BASE_URL } from '../../utils/apiFetch'

function resolveIconSrc(icon) {
    if (!icon) return null
    if (/^(https?:|blob:|data:)/i.test(icon)) return icon
    return `${BASE_URL}/uploads/${icon}`
}

/**
 * TopicIcon – displays a topic's icon image or a letter-circle fallback.
 * Props:
 *   icon – URL string (absolute, blob preview, or filename)
 *   name – topic name for fallback initial
 *   size – 'sm' | 'md' | 'lg' (default 'sm')
 *   className – extra CSS class override for the img/placeholder
 */
export default function TopicIcon({ icon, name, size = 'sm', className, placeholderClassName }) {
    const sizeClass = `topic-icon--${size}`
    const src = resolveIconSrc(icon)

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={className || `topic-icon-img ${sizeClass}`}
            />
        )
    }

    return (
        <div className={placeholderClassName || className || `topic-icon-placeholder ${sizeClass}`}>
            {(name ?? '?').charAt(0).toUpperCase()}
        </div>
    )
}
