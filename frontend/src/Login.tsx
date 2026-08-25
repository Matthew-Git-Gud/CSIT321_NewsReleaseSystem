import { type FormEvent, useState } from 'react'
import { login, type User } from './services/auth'
import './Auth.css'
import ThemeToggle from './ThemeToggle'

type LoginProps = {
  onSuccess: (user: User) => void
  onRegister: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function Login({ onSuccess, onRegister, theme, onToggleTheme }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)
      onSuccess(user)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      {/* The same theme control is available before a guest signs in. */}
      <div className="auth-theme-control">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <section className="auth-card">
        <a className="brand auth-brand" href="#home">News Release System</a>

        <div className="auth-heading">
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in to your account.</h1>
          <p>Access your saved stories, comments and personalised news.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?
          <button type="button" onClick={onRegister}>Sign up</button>
        </p>
      </section>
    </main>
  )
}

export default Login
