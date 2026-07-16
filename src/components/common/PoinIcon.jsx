/**
 * PoinIcon — gold star-coin image used for points everywhere.
 */
export default function PoinIcon({ size = 24, className = '', alt = '' }) {
    return (
        <img
            className={`poin-icon${className ? ` ${className}` : ''}`}
            src="/icons/poin-coin.png"
            alt={alt}
            width={size}
            height={size}
            style={{ width: size, height: size }}
            draggable={false}
            aria-hidden={alt ? undefined : true}
        />
    )
}
