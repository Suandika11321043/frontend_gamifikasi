import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Volume2, VolumeX } from 'lucide-react'
import {
    isMusicEnabled,
    startBgMusic,
    stopBgMusic,
    resumeBgMusicIfPreferred,
    pauseBgMusicForRoute,
    subscribeMusic,
    getMusicState,
} from '../../utils/bgMusic'
import './MusicToggle.css'

function isStudentPath(pathname) {
    return pathname === '/student' || pathname.startsWith('/student/')
}

/**
 * Floating music on/off for student pages.
 * Plays real audio file (Twinkle Twinkle); preference saved in localStorage.
 */
export default function MusicToggle() {
    const location = useLocation()
    const onStudent = isStudentPath(location.pathname)
    const [on, setOn] = useState(() => isMusicEnabled())

    useEffect(() => subscribeMusic((state) => {
        // Button follows preference so ON stays ON even if autoplay briefly blocks
        setOn(state.preferred)
    }), [])

    useEffect(() => {
        if (!onStudent) {
            pauseBgMusicForRoute()
            setOn(isMusicEnabled())
            return undefined
        }

        let cancelled = false
        ;(async () => {
            if (isMusicEnabled()) {
                await resumeBgMusicIfPreferred()
            }
            if (!cancelled) {
                setOn(getMusicState().preferred)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [onStudent, location.pathname])

    const handleToggle = useCallback(async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (on) {
            stopBgMusic()
            setOn(false)
            return
        }
        await startBgMusic()
        setOn(true)
    }, [on])

    if (!onStudent) return null

    return (
        <button
            type="button"
            className={`music-toggle${on ? ' music-toggle--on' : ''}`}
            onClick={handleToggle}
            aria-pressed={on}
            aria-label={on ? 'Matikan musik' : 'Nyalakan musik'}
            title={on ? 'Musik: Nyala' : 'Musik: Mati'}
        >
            <span className="music-toggle__icon" aria-hidden="true">
                {on ? <Volume2 size={24} strokeWidth={2.5} /> : <VolumeX size={24} strokeWidth={2.5} />}
            </span>
            <span className="music-toggle__label">{on ? 'Musik ON' : 'Musik OFF'}</span>
        </button>
    )
}
