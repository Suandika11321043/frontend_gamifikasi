import { useNavigate } from 'react-router-dom'
import './StudentLandingPage.css'

function StudentLandingPage() {
    const navigate = useNavigate()

    const handlePlay = () => {
        navigate('/student/daftar-siswa')
    }

    return (
        <div className="landing-wrapper">
            <div className="landing-sky" aria-hidden="true" />
            <div className="landing-sun" aria-hidden="true" />
            <div className="landing-grass" aria-hidden="true" />
            <div className="landing-hill landing-hill--left" aria-hidden="true" />
            <div className="landing-hill landing-hill--right" aria-hidden="true" />

            <div className="landing-cloud landing-cloud--1" aria-hidden="true" />
            <div className="landing-cloud landing-cloud--2" aria-hidden="true" />
            <div className="landing-cloud landing-cloud--3" aria-hidden="true" />

            <div className="landing-bloom landing-bloom--1" aria-hidden="true" />
            <div className="landing-bloom landing-bloom--2" aria-hidden="true" />
            <div className="landing-bloom landing-bloom--3" aria-hidden="true" />

            <main className="landing-content">
                <header className="landing-brand">
                    <img
                        className="landing-brand-logo"
                        src="/logos/tk-mawar.svg"
                        alt=""
                        width={96}
                        height={96}
                        draggable={false}
                    />
                    <h1 className="landing-brand-name">TK Mawar</h1>
                    <p className="landing-brand-place">Sitoluama · Laguboti</p>
                </header>

                <p className="landing-hello">Halo, sahabat kecil!</p>
                <p className="landing-invite">Yuk bermain sambil belajar bersama</p>

                <button
                    type="button"
                    className="play-btn"
                    onClick={handlePlay}
                    aria-label="Mulai bermain"
                >
                    <span className="play-btn__ring" aria-hidden="true" />
                    <span className="play-btn__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </span>
                    <span className="play-btn__label">AYO MAIN</span>
                </button>

                <p className="landing-hint">Ketuk tombol hijau di atas, ya</p>
            </main>
        </div>
    )
}

export default StudentLandingPage
