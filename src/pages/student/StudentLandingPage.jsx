import { useNavigate } from 'react-router-dom'
import {
    IconStar, IconSparkles, IconBalloon, IconButterfly, IconCandy,
    IconRainbow, IconFox, IconFlag, IconBooks, IconTarget, IconCrown,
} from '../../components/common/AppIcons'
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

            <em className="landing-float landing-float--1"><IconStar size={28} /></em>
            <em className="landing-float landing-float--2"><IconBalloon size={28} /></em>
            <em className="landing-float landing-float--3"><IconButterfly size={28} /></em>
            <em className="landing-float landing-float--4"><IconCandy size={28} /></em>
            <em className="landing-float landing-float--5"><IconRainbow size={28} /></em>
            <em className="landing-float landing-float--6"><IconSparkles size={28} /></em>

            <div className="landing-content">
                <div className="landing-hero-card">
                    <div className="landing-mascot" aria-hidden="true">
                        <span className="mascot-face"><IconFox size={56} /></span>
                        <span className="mascot-sparkle mascot-sparkle--1"><IconSparkles size={18} /></span>
                        <span className="mascot-sparkle mascot-sparkle--2"><IconStar size={16} /></span>
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
                    <span className="path-step path-step--done"><IconFlag size={22} /></span>
                    <span className="path-line" />
                    <span className="path-step"><IconBooks size={22} /></span>
                    <span className="path-line" />
                    <span className="path-step"><IconTarget size={22} /></span>
                    <span className="path-line" />
                    <span className="path-step path-step--goal"><IconCrown size={22} /></span>
                </div>
            </div>
        </div>
    )
}

export default StudentLandingPage
