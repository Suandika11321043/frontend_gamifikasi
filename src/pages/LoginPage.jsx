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
            {/* Floating decorations */}
            <span className="login-deco login-deco--star1">⭐</span>
            <span className="login-deco login-deco--star2">🌟</span>
            <span className="login-deco login-deco--balloon">🎈</span>
            <span className="login-deco login-deco--rainbow">🌈</span>
            <span className="login-deco login-deco--cloud">☁️</span>

            <div className="login-card">
                <div className="login-mascot">🦁</div>
                <h1 className="login-title">Halo, Guru!</h1>
                <p className="login-subtitle">Masuk untuk mengelola murid, membuat soal, dan mengatur pembelajaran! 📚</p>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {wasExpired && !error && (
                        <p className="login-error">⏰ Sesi kamu telah berakhir. Silakan login kembali.</p>
                    )}
                    {error && <p className="login-error">⚠️ {error}</p>}

                    <div className="form-group">
                        <label htmlFor="username">👤 Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Tulis username kamu..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">🔒 Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Tulis password kamu..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? '⏳ Sebentar ya...' : '🚀 Ayo Masuk!'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default LoginPage
