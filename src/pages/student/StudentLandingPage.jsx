import { useNavigate } from 'react-router-dom'
import './StudentLandingPage.css'

function StudentLandingPage() {
    const navigate = useNavigate()

    const handlePlay = () => {
        navigate('/student/daftar-siswa')
    }

    return (
        <div className="landing-wrapper">
            {/* Background decorations */}
            <div className="landing-decoration landing-decoration--1" />
            <div className="landing-decoration landing-decoration--2" />
            <div className="landing-decoration landing-decoration--3" />

            <div className="landing-content">
                <div className="landing-header">
                    <span className="landing-badge">🎮 Gamifikasi Belajar</span>
                    <h1 className="landing-title">Siap Belajar Hari Ini?</h1>
                    <p className="landing-subtitle">
                        Jawab soal, kumpulkan poin, dan raih badge terbaikmu!
                    </p>
                </div>

                {/* Big Play Button */}
                <button className="play-btn" onClick={handlePlay} aria-label="Mulai bermain">
                    <span className="play-btn__ripple" />
                    <span className="play-btn__icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </span>
                    <span className="play-btn__label">MULAI</span>
                </button>

                <p className="landing-hint">Tekan tombol untuk memulai kuis</p>

                {/* Info cards */}
                <div className="landing-cards">
                    <div className="info-card">
                        <span className="info-card__icon">⭐</span>
                        <p className="info-card__label">Kumpulkan Poin</p>
                    </div>
                    <div className="info-card">
                        <span className="info-card__icon">🏅</span>
                        <p className="info-card__label">Raih Badge</p>
                    </div>
                    <div className="info-card">
                        <span className="info-card__icon">🏆</span>
                        <p className="info-card__label">Naik Peringkat</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentLandingPage
