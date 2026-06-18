import { useNavigate } from 'react-router-dom'
import './StudentLandingPage.css'

function StudentLandingPage() {
    const navigate = useNavigate()

    const handlePlay = () => {
        navigate('/student/daftar-siswa')
    }

    return (
        <div className="landing-wrapper">
            <div className="landing-sky" />
            <div className="landing-grass" />

            <div className="landing-cloud landing-cloud--1" />
            <div className="landing-cloud landing-cloud--2" />
            <div className="landing-cloud landing-cloud--3" />

            <div className="landing-rainbow" aria-hidden="true" />

            <em className="landing-float landing-float--1">⭐</em>
            <em className="landing-float landing-float--2">🎈</em>
            <em className="landing-float landing-float--3">🦋</em>
            <em className="landing-float landing-float--4">🍭</em>
            <em className="landing-float landing-float--5">🌈</em>
            <em className="landing-float landing-float--6">✨</em>

            <div className="landing-content">
                <div className="landing-hero-card">
                    <div className="landing-mascot" aria-hidden="true">
                        <span className="mascot-face">🦊</span>
                        <span className="mascot-sparkle mascot-sparkle--1">✨</span>
                        <span className="mascot-sparkle mascot-sparkle--2">💫</span>
                    </div>

                    <span className="landing-badge">Petualangan Belajar</span>
                    <h1 className="landing-title">
                        Ayo Bermain
                        <span className="landing-title-accent">&amp; Belajar!</span>
                    </h1>
                    <button className="play-btn" onClick={handlePlay} aria-label="Mulai bermain">
                        <span className="play-btn__glow" />
                        <span className="play-btn__ripple" />
                        <span className="play-btn__icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </span>
                        <span className="play-btn__label">MULAI</span>
                    </button>
                </div>

                <div className="landing-path" aria-hidden="true">
                    <span className="path-step path-step--done">🏁</span>
                    <span className="path-line" />
                    <span className="path-step">📚</span>
                    <span className="path-line" />
                    <span className="path-step">🎯</span>
                    <span className="path-line" />
                    <span className="path-step path-step--goal">👑</span>
                </div>
            </div>
        </div>
    )
}

export default StudentLandingPage
