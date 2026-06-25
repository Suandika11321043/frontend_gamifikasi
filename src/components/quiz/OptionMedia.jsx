import './OptionMedia.css'

/** Deteksi jenis media dari URL Cloudinary atau ekstensi file. */
export function getOptionMediaType(url) {
    if (!url) return null
    const path = url.toLowerCase().split('?')[0]
    if (/\.(mp3|wav|ogg|aac|m4a|flac|opus|webm)$/.test(path)) return 'audio'
    if (/\.(mp4|mov|avi|mkv)$/.test(path)) return 'video'
    if (/\/video\/upload\//i.test(url)) return 'audio'
    return 'image'
}

/**
 * Media opsi — gambar, audio, atau video. Audio dibungkus agar tidak merusak layout kartu.
 */
export default function OptionMedia({
    url,
    alt = 'Media',
    className = '',
    onLoad,
}) {
    if (!url) return null

    const type = getOptionMediaType(url)
    const stop = (e) => e.stopPropagation()
    const rootClass = ['option-media', `option-media--${type}`, className].filter(Boolean).join(' ')

    if (type === 'audio') {
        return (
            <div className={rootClass} onClick={stop} onPointerDown={stop}>
                <span className="option-media__badge" aria-hidden="true">🎵</span>
                <audio controls preload="metadata" src={url} className="option-media__player" />
            </div>
        )
    }

    if (type === 'video') {
        return (
            <div className={rootClass} onClick={stop} onPointerDown={stop}>
                <video controls preload="metadata" src={url} className="option-media__player option-media__player--video" />
            </div>
        )
    }

    return (
        <div className={rootClass}>
            <img
                src={url}
                alt={alt}
                className="option-media__img"
                loading="lazy"
                onLoad={onLoad}
            />
        </div>
    )
}
