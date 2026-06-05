import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import './LoginPage.css'

const TOPO_RINGS = [
  { rx: 58,  ry: 36  },
  { rx: 108, ry: 64  },
  { rx: 162, ry: 92  },
  { rx: 216, ry: 124 },
  { rx: 272, ry: 154 },
  { rx: 328, ry: 186 },
  { rx: 384, ry: 216 },
  { rx: 438, ry: 248 },
  { rx: 490, ry: 278 },
  { rx: 540, ry: 308 },
]

function TopoLines() {
  return (
    <svg
      className="login-topo"
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g transform="translate(400 400)">
        {TOPO_RINGS.map((r, i) => (
          <ellipse key={i} className="topo-ring" rx={r.rx} ry={r.ry} />
        ))}
      </g>
    </svg>
  )
}

function GemMark() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <polygon points="8,1 15,7 8,19 1,7" fill="#7c5cfc" fillOpacity="0.92" />
      <polygon points="1,7 15,7 8,13" fill="#0e0c1a" fillOpacity="0.28" />
      <line x1="1" y1="7" x2="15" y2="7" stroke="#b8a8ff" strokeWidth="0.6" strokeOpacity="0.4" />
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
        <TopoLines />
        <div className="login-grain" />

        <header className="login-left__header">
          <GemMark />
          <span className="login-wordmark">HIDDEN GEMS</span>
        </header>

        <main className="login-left__main">
          <h1 className="login-headline">
            Find what<br />
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
