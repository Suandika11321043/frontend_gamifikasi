import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login } from '../services/authService'
import { getErrorMessage } from '../utils/apiFetch'
import './LoginPage.css'

function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { saveToken } = useAuth()

    const wasExpired = location.state?.expired === true

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!username || !password) {
            setError('Username dan password wajib diisi.')
            return
        }

        setLoading(true)
        try {
            const data = await login(username, password)

            if (data.token) {
                saveToken(data.token)
            }

            navigate('/dashboard')
        } catch (err) {
            setError(getErrorMessage(err, 'Gagal masuk ke sistem. Silakan coba lagi.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-wrapper">
            <div className="login-sky" aria-hidden="true" />
            <div className="login-sun" aria-hidden="true" />
            <div className="login-grass" aria-hidden="true" />
            <div className="login-hill login-hill--left" aria-hidden="true" />
            <div className="login-hill login-hill--right" aria-hidden="true" />

            <div className="login-cloud login-cloud--1" aria-hidden="true" />
            <div className="login-cloud login-cloud--2" aria-hidden="true" />
            <div className="login-cloud login-cloud--3" aria-hidden="true" />

            <div className="login-bloom login-bloom--1" aria-hidden="true" />
            <div className="login-bloom login-bloom--2" aria-hidden="true" />

            <main className="login-card">
                <header className="login-brand">
                    <img
                        className="login-brand-logo"
                        src="/logos/tk-mawar.svg"
                        alt=""
                        width={80}
                        height={80}
                        draggable={false}
                    />
                    <h1 className="login-brand-name">TK Mawar</h1>
                    <p className="login-brand-place">Sitoluama · Laguboti</p>
                </header>

                <p className="login-greeting">Halo, Bapak/Ibu Guru!</p>
                <p className="login-subtitle">
                    Masuk untuk mengelola murid, soal, dan kegiatan belajar
                </p>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {wasExpired && !error && (
                        <p className="login-error" role="alert">
                            Sesi Anda telah berakhir. Silakan masuk kembali.
                        </p>
                    )}
                    {error && (
                        <p className="login-error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Tulis username Anda"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Tulis password Anda"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Sebentar ya...' : 'Masuk'}
                    </button>
                </form>
            </main>
        </div>
    )
}

export default LoginPage
