/** Preset avatar murid: generated:boy | generated:girl */

export const AVATAR_PREFIX = 'generated:'

export const BOY_AVATAR = {
    id: 'generated:boy',
    label: 'Laki-laki',
    src: '/avatars/boy.png',
    accent: '#2563eb',
}

export const GIRL_AVATAR = {
    id: 'generated:girl',
    label: 'Perempuan',
    src: '/avatars/girl.png',
    accent: '#db2777',
}

export function isGeneratedAvatar(avatar) {
    return typeof avatar === 'string' && avatar.startsWith(AVATAR_PREFIX)
}

/** Normalisasi key lama (generated:boy:0) ke format baru. */
export function normalizeAvatarKey(avatar) {
    if (!isGeneratedAvatar(avatar)) return null
    if (avatar.startsWith('generated:girl')) return GIRL_AVATAR.id
    if (avatar.startsWith('generated:boy')) return BOY_AVATAR.id
    return null
}

export function parseAvatarKey(avatar) {
    const key = normalizeAvatarKey(avatar)
    if (!key) return null
    return { gender: key === GIRL_AVATAR.id ? 'girl' : 'boy' }
}

export function getAvatarPreset(avatar) {
    const key = normalizeAvatarKey(avatar)
    if (!key) return null
    return key === GIRL_AVATAR.id ? GIRL_AVATAR : BOY_AVATAR
}

export function getAvatarByGender(gender) {
    return gender === 'girl' ? GIRL_AVATAR : BOY_AVATAR
}

export function displayNameForPlate(name) {
    const trimmed = (name ?? '').trim()
    if (!trimmed) return 'Nama Murid'
    return trimmed
}

/** Ukuran font papan nama menyesuaikan panjang nama agar muat tanpa "...". */
export function plateFontScale(name, size = 'md') {
    const len = displayNameForPlate(name).length
    const base = { sm: 7, md: 10, lg: 12, xl: 14 }[size] ?? 10
    if (len <= 8) return base
    if (len <= 12) return Math.max(6, base - 1)
    if (len <= 18) return Math.max(5.5, base - 2)
    if (len <= 24) return Math.max(5, base - 3)
    return Math.max(4.5, base - 4)
}

