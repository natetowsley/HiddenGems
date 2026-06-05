import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import './LoginPage.css'

const MAP_PINS = [
  { top: '18%', left: '22%', delay: 0   },
  { top: '30%', left: '70%', delay: 1.4 },
  { top: '54%', left: '38%', delay: 2.8 },
  { top: '46%', left: '72%', delay: 4.2 },
  { top: '74%', left: '55%', delay: 5.6 },
]

function MapPin({ top, left, delay }: { top: string; left: string; delay: number }) {
  return (
    <div className="map-pin" style={{ top, left }}>
      <div className="map-pin__pulse" style={{ animationDelay: `${delay}s` }} />
      <svg className="map-pin__icon" viewBox="0 0 20 26" fill="none" aria-hidden="true">
        <path d="M10 0C4.477 0 0 4.477 0 10c0 7.333 10 16 10 16S20 17.333 20 10C20 4.477 15.523 0 10 0z" fill="#6FCF97" fillOpacity="0.75" />
        <circle cx="10" cy="10" r="3.5" fill="#0e2822" fillOpacity="0.6" />
      </svg>
    </div>
  )
}

function MapBackground() {
  return (
    <>
      <div className="map-grid" aria-hidden="true" />
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

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="login-page">

      {/* ── Left: branding panel ── */}
      <div className="login-left">
        <MapBackground />
        <div className="login-grain" />

        <header className="login-left__header">
          <GemMark />
          <span className="login-wordmark">HIDDEN GEMS</span>
        </header>

        <main className="login-left__main">
          <h1 className="login-headline">
            Find spots<br />
            <em>nobody<br />talks about</em>
          </h1>
          <p className="login-subtext">
            Hidden local spots, real reviews,<br />
            and the thrill of discovery.
          </p>
        </main>

        <footer className="login-left__footer">
          <span className="login-coords">37.7749° N &nbsp;·&nbsp; 122.4194° W</span>
        </footer>
      </div>

      {/* ── Right: form panel ── */}
      <div className="login-right">
        <div className="login-mobile-logo">
          <GemMark />
          <span className="login-wordmark">HIDDEN GEMS</span>
        </div>

        <div className="login-form-wrap">
          <div className="login-form-heading">
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-sub">Sign in to continue your exploration</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email" className="login-label">EMAIL</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="login-input"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">PASSWORD</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="login-input"
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p className="login-cta">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>

    </div>
  )
}
