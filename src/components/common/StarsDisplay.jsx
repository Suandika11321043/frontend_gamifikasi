/**
 * Menampilkan bintang: ikon SVG per bintang (1–5), teks jika > 5.
 * Props:
 *   count         – jumlah bintang
 *   className     – kelas wrapper
 *   textLabel     – sufiks teks saat > 5 (default "bintang")
 *   emptyFallback – tampilan jika count 0 (default: tidak render)
 *   size          – ukuran ikon SVG (default 14)
 */
import { IconStar } from './AppIcons'

export default function StarsDisplay({
    count,
    className = '',
    textLabel = 'bintang',
    emptyFallback = null,
    size = 14,
}) {
    const stars = count ?? 0

    if (stars <= 0) {
        if (emptyFallback != null) {
            return <span className={className}>{emptyFallback}</span>
        }
        return null
    }

    if (stars > 5) {
        return (
            <span className={`${className} stars-display-text`.trim()}>
                <IconStar size={size} className="stars-display-icon" />
                {' '}{stars} {textLabel}
            </span>
        )
    }

    return (
        <span
            className={`${className} stars-display-icons`.trim()}
            aria-label={`${stars} ${textLabel}`}
        >
            {Array.from({ length: stars }, (_, i) => (
                <IconStar key={i} size={size} className="stars-display-icon" />
            ))}
        </span>
    )
}
