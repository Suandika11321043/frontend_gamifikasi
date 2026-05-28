import { BASE_URL } from '../../utils/apiFetch'

/**
 * TopicIcon – displays a topic's icon image or a letter-circle fallback.
 * Props:
 *   icon – URL string (absolute or filename)
 *   name – topic name for fallback initial
 *   size – 'sm' | 'md' | 'lg' (default 'sm')
 *   className – extra CSS class override for the img/placeholder
 */
export default function TopicIcon({ icon, name, size = 'sm', className, placeholderClassName }) {
    const sizeClass = `topic-icon--${size}`

    if (icon) {
        const src = icon.startsWith('http') ? icon : `${BASE_URL}/uploads/${icon}`
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
