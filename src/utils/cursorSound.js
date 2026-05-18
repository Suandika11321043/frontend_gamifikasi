/**
 * cursorSound.js
 * Gamification app — playful hover/click sounds via Web Audio API.
 * No external files needed; everything is generated programmatically.
 *
 * AudioContext is created on the first click (browser autoplay policy).
 * After that, hover sounds are also enabled.
 */

let _ctx = null
let _enabled = false
let _lastHoverEl = null
let _lastHoverTime = 0

function getCtx() {
    if (!_ctx) {
        _ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (_ctx.state === 'suspended') _ctx.resume()
    return _ctx
}

/**
 * Play a simple sine-wave tone that slides from `freq` to `endFreq`.
 * @param {number} freq      - Start frequency in Hz
 * @param {number} endFreq   - End frequency in Hz
 * @param {number} duration  - Duration in seconds
 * @param {number} volume    - Peak gain (0–1, keep below 0.15 to stay pleasant)
 */
function beep(freq, endFreq, duration, volume) {
    try {
        const ac = getCtx()
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.connect(gain)
        gain.connect(ac.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ac.currentTime)
        osc.frequency.exponentialRampToValueAtTime(endFreq, ac.currentTime + duration)
        gain.gain.setValueAtTime(volume, ac.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
        osc.start(ac.currentTime)
        osc.stop(ac.currentTime + duration + 0.02)
    } catch (_) {
        // Silently ignore — sound is non-critical
    }
}

/** Selector for interactive elements that should trigger sounds */
const INTERACTIVE_SELECTOR =
    'a, button, [role="button"], input[type="submit"], select, label[for], summary'

/** Student-page wrapper selector — sounds only play here */
const STUDENT_WRAPPER_SELECTOR =
    '.landing-wrapper, .ds-wrapper, .lt-wrapper, .quiz-wrapper'

function getInteractiveAncestor(el) {
    return el && el.closest ? el.closest(INTERACTIVE_SELECTOR) : null
}

function isInStudentPage(el) {
    return el && el.closest ? Boolean(el.closest(STUDENT_WRAPPER_SELECTOR)) : false
}

/**
 * Schedule a tone at a time offset from now.
 * @param {number} freq       - Start frequency Hz
 * @param {number} endFreq    - End frequency Hz
 * @param {number} offset     - Start offset in seconds from now
 * @param {number} duration   - Duration in seconds
 * @param {number} volume     - Peak gain (0–1)
 * @param {OscillatorType} [type] - 'sine' | 'triangle' etc.
 */
function beepAt(freq, endFreq, offset, duration, volume, type = 'sine') {
    try {
        const ac = getCtx()
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.connect(gain)
        gain.connect(ac.destination)
        osc.type = type
        const t = ac.currentTime + offset
        osc.frequency.setValueAtTime(freq, t)
        if (endFreq !== freq) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration)
        }
        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(volume, t + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
        osc.start(t)
        osc.stop(t + duration + 0.02)
    } catch (_) { }
}

/**
 * Kid-friendly celebratory sound for a correct answer.
 * Plays a happy ascending C-major arpeggio: C5 → E5 → G5 → C6.
 */
export function playCorrectSound() {
    try {
        beepAt(523, 523, 0.00, 0.10, 0.11)
        beepAt(659, 659, 0.09, 0.10, 0.11)
        beepAt(784, 784, 0.18, 0.10, 0.11)
        beepAt(1047, 1047, 0.27, 0.24, 0.13)
    } catch (_) { }
}

/**
 * Kid-friendly gentle sound for a wrong answer.
 * Plays a soft descending D→A→F phrase — encouraging, not harsh.
 */
export function playWrongSound() {
    try {
        beepAt(587, 494, 0.00, 0.13, 0.08)
        beepAt(440, 370, 0.14, 0.13, 0.07)
        beepAt(349, 294, 0.28, 0.20, 0.06)
    } catch (_) { }
}

/**
 * Initialize cursor sounds using event delegation on `document`.
 * Call once at app startup (e.g. in main.jsx after render).
 */
export function initCursorSound() {
    // Click: enable context + play a rising "pop" (G5 → G6) — coin-collect feel
    document.addEventListener(
        'click',
        (e) => {
            if (!isInStudentPage(e.target)) return
            _enabled = true
            if (getInteractiveAncestor(e.target)) {
                beep(784, 1568, 0.11, 0.09)
            }
        },
        true,
    )

    // Hover: gentle rising "plink" (A5 → C6) — only after first click
    document.addEventListener(
        'mouseover',
        (e) => {
            if (!_enabled || !isInStudentPage(e.target)) return
            const target = getInteractiveAncestor(e.target)
            if (!target || target === _lastHoverEl) return
            const now = Date.now()
            if (now - _lastHoverTime < 80) return   // throttle: max once per 80 ms
            _lastHoverEl = target
            _lastHoverTime = now
            beep(880, 1046, 0.07, 0.04)
        },
        true,
    )
}
