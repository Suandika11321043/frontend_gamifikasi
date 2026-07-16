import { displayNameForPlate, getAvatarPreset, plateFontScale } from '../../utils/avatarPresets'
import './GeneratedAvatar.css'

/**
 * Avatar murid: gambar + papan nama di baju.
 * Props:
 *   avatarKey – "generated:boy" | "generated:girl"
 *   name      – nama murid (tampil lengkap di papan nama baju)
 *   size      – 'sm' | 'md' | 'lg' | 'xl'
 *   selected  – highlight border (untuk picker)
 */
function GeneratedAvatar({
    avatarKey,
    name,
    size = 'md',
    selected = false,
    className = '',
    showNameplate = true,
}) {
    const preset = getAvatarPreset(avatarKey)
    if (!preset) return null

    const plate = displayNameForPlate(name)
    const fontSize = plateFontScale(name, size)
    const sizeClass = `gen-avatar--${size}`
    const selectedClass = selected ? ' gen-avatar--selected' : ''
    const bareClass = showNameplate ? '' : ' gen-avatar--bare'

    return (
        <div
            className={`gen-avatar ${sizeClass}${selectedClass}${bareClass} ${className}`.trim()}
            title={name || preset.label}
            role="img"
            aria-label={`Avatar ${name || preset.label}`}
        >
            <img
                className="gen-avatar__img"
                src={preset.src}
                alt=""
                draggable={false}
            />
            {showNameplate && (
                <div
                    className="gen-avatar__plate"
                    style={{ borderColor: preset.accent, color: preset.accent }}
                >
                    <span
                        className="gen-avatar__plate-text"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {plate}
                    </span>
                </div>
            )}
        </div>
    )
}

export default GeneratedAvatar
