import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import './SignupPage.css'

const MAP_PINS = [
  { top: '15%', left: '30%', delay: 0   },
  { top: '28%', left: '65%', delay: 1.4 },
  { top: '50%', left: '20%', delay: 2.8 },
  { top: '42%', left: '75%', delay: 4.2 },
  { top: '70%', left: '48%', delay: 5.6 },
]

function MapPin({ top, left, delay }: { top: string; left: string; delay: number }) {
  return (
    <div className="signup-map-pin" style={{ top, left }}>
      <div className="signup-map-pin__pulse" style={{ animationDelay: `${delay}s` }} />
      <div className="signup-map-pin__pulse" style={{ animationDelay: `${delay + 1}s` }} />
      <svg className="signup-map-pin__icon" viewBox="0 0 20 26" fill="none" aria-hidden="true">
        <path d="M10 0C4.477 0 0 4.477 0 10c0 7.333 10 16 10 16S20 17.333 20 10C20 4.477 15.523 0 10 0z" fill="#6FCF97" fillOpacity="0.75" />
        <circle cx="10" cy="10" r="3.5" fill="#0e2822" fillOpacity="0.6" />
      </svg>
    </div>
  )
}

function MapBackground() {
  return (
    <>
      <div className="signup-map-grid" aria-hidden="true" />
      {MAP_PINS.map((p, i) => (
        <MapPin key={i} top={p.top} left={p.left} delay={p.delay} />
      ))}
    </>
  )
}

function GemMark() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <polygon points="8,1 15,7 8,19 1,7" fill="#6FCF97" fillOpacity="0.92" />
      <polygon points="1,7 15,7 8,13" fill="#0e2822" fillOpacity="0.3" />
      <line x1="1" y1="7" x2="15" y2="7" stroke="#EEEEEE" strokeWidth="0.6" strokeOpacity="0.3" />
    </svg>
  )
}

export default function SignupPage() {
  const [name, setName]                       = useState('')
  const [username, setUsername]               = useState('')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [success, setSuccess]                 = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, username } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="signup-page">

      {/* ── Left: branding panel ── */}
      <div className="signup-left">
        <MapBackground />
        <div className="signup-grain" />

        <header className="signup-left__header">
          <GemMark />
          <span className="signup-wordmark">HIDDEN GEMS</span>
        </header>

        <main className="signup-left__main">
          <h1 className="signup-headline">
            Your next<br />
            <em>hidden gem<br />is waiting</em>
          </h1>
          <p className="signup-subtext">
            Join a community of explorers<br />
            uncovering what your city keeps secret.
          </p>
        </main>

        <footer className="signup-left__footer">
          <span className="signup-coords">37.7749° N &nbsp;·&nbsp; 122.4194° W</span>
        </footer>
      </div>

      {/* ── Right: form panel ── */}
      <div className="signup-right">
        <div className="signup-mobile-logo">
          <GemMark />
          <span className="signup-wordmark">HIDDEN GEMS</span>
        </div>

        <div className="signup-form-wrap">
          {success ? (
            <div className="signup-success">
              <div className="signup-success__icon">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <circle cx="18" cy="18" r="16.5" stroke="#6FCF97" strokeWidth="1.5" />
                  <path d="M11 18.5l5 5 9-10" stroke="#6FCF97" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="signup-success__title">Check your inbox</h2>
              <p className="signup-success__body">
                We sent a confirmation link to{' '}
                <strong>{email}</strong>. Click it to activate your account and start exploring.
              </p>
              <Link to="/login" className="signup-success__link">Back to sign in →</Link>
            </div>
          ) : (
            <>
              <div className="signup-form-heading">
                <h2 className="signup-form-title">Create account</h2>
                <p className="signup-form-sub">Start finding hidden spots today</p>
              </div>

              <form onSubmit={handleSubmit} className="signup-form">
                <div className="signup-field">
                  <label htmlFor="name" className="signup-label">DISPLAY NAME</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className="signup-input"
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="username" className="signup-label">USERNAME</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="explorer42"
                    className="signup-input"
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="email" className="signup-label">EMAIL</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="signup-input"
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="password" className="signup-label">PASSWORD</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="signup-input"
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="confirm-password" className="signup-label">CONFIRM PASSWORD</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="signup-input"
                  />
                </div>

                {error && <p className="signup-error">{error}</p>}

                <button type="submit" disabled={loading} className="signup-submit">
                  {loading ? 'Creating account…' : 'Create account →'}
                </button>
              </form>

              <p className="signup-cta">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
