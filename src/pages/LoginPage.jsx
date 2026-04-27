import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import './LoginPage.css'

function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

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
                localStorage.setItem('token', data.token)
            }

            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Tidak dapat terhubung ke server. Coba lagi nanti.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <h1 className="login-title">Selamat Datang</h1>
                <p className="login-subtitle">Masuk ke akun Anda</p>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {error && <p className="login-error">{error}</p>}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Masukkan username"
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
                            placeholder="Masukkan password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Memuat...' : 'Masuk'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default LoginPage
