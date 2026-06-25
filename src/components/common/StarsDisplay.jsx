/**
 * Menampilkan bintang: ikon per bintang (1–5), teks jika > 5.
 * Props:
 *   count         – jumlah bintang
 *   className     – kelas wrapper
 *   textLabel     – sufiks teks saat > 5 (default "bintang")
 *   emptyFallback – tampilan jika count 0 (default: tidak render)
 */
export default function StarsDisplay({
    count,
    className = '',
    textLabel = 'bintang',
    emptyFallback = null,
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
            <span className={className}>
                ⭐ {stars} {textLabel}
            </span>
        )
    }

    return (
        <span
            className={`${className} stars-display-icons`.trim()}
            aria-label={`${stars} ${textLabel}`}
        >
            {Array.from({ length: stars }, (_, i) => (
                <span key={i} className="stars-display-icon" aria-hidden="true">⭐</span>
            ))}
        </span>
    )
}
