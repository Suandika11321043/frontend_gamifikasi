/**
 * bgMusic.js — real audio-file background music (HTMLAudioElement).
 * Uses /public/audio/cartoon-bg.mp3 (from "52. Cartoon.mp3").
 * Preference saved in localStorage.
 */

const STORAGE_KEY = 'tk-mawar-bg-music'
const SOURCE = '/audio/cartoon-bg.mp3'
const VOLUME = 0.4

let _audio = null
let _enabled = false
let _playing = false
const _listeners = new Set()

function notify() {
    const state = getMusicState()
    _listeners.forEach((fn) => {
        try { fn(state) } catch { /* ignore */ }
    })
}

export function getMusicState() {
    return {
        preferred: isMusicEnabled(),
        playing: _enabled && _playing && Boolean(_audio && !_audio.paused),
        enabled: _enabled,
    }
}

export function subscribeMusic(listener) {
    _listeners.add(listener)
    return () => _listeners.delete(listener)
}

function ensureAudio() {
    if (_audio) return _audio

    const audio = new Audio(SOURCE)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = VOLUME

    audio.addEventListener('play', () => {
        _playing = true
        notify()
    })
    audio.addEventListener('pause', () => {
        _playing = false
        notify()
    })

    _audio = audio
    return _audio
}

export function isMusicEnabled() {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'on'
    } catch {
        return false
    }
}

export function setMusicPreference(on) {
    try {
        localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
    } catch { /* ignore */ }
}

export async function startBgMusic() {
    _enabled = true
    setMusicPreference(true)
    const audio = ensureAudio()
    audio.volume = VOLUME
    try {
        await audio.play()
        _playing = true
    } catch {
        // Autoplay blocked until a later gesture — preference stays ON
        _playing = false
    }
    notify()
    return _playing
}

export function stopBgMusic() {
    _enabled = false
    _playing = false
    setMusicPreference(false)
    if (_audio) {
        try {
            _audio.pause()
            _audio.currentTime = 0
        } catch { /* ignore */ }
    }
    notify()
    return false
}

export async function toggleBgMusic() {
    if (_enabled && _audio && !_audio.paused) {
        return stopBgMusic()
    }
    return startBgMusic()
}

export function isBgMusicPlaying() {
    return Boolean(_audio && !_audio.paused && _enabled)
}

/** Pause when leaving student routes (keep preference) */
export function pauseBgMusicForRoute() {
    if (_audio && !_audio.paused) {
        try { _audio.pause() } catch { /* ignore */ }
    }
    _playing = false
    notify()
}

/** Resume only if user preference is ON */
export async function resumeBgMusicIfPreferred() {
    if (!isMusicEnabled()) {
        _enabled = false
        _playing = false
        notify()
        return false
    }
    return startBgMusic()
}
