import { type FormEvent, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { adminLogin, type AdminUser } from './services/admin'
import './Auth.css'

type AdminLoginProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onSuccess: (user: AdminUser) => void
  onHome: () => void
}

function AdminLogin({ theme, onToggleTheme, onSuccess, onHome }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await adminLogin(email, password)
      onSuccess(user)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-theme-control">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <section className="auth-card">
        <button className="brand auth-brand brand-button" type="button" onClick={onHome}>
          News Release System
        </button>

        <div className="auth-heading">
          <p className="eyebrow">Restricted area</p>
          <h1>Admin sign in.</h1>
          <p>Use an administrator account to access the content-management dashboard.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in as admin'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AdminLogin
