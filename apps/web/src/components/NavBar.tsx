import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
]

export default function NavBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const name = (user?.user_metadata?.name as string) || user?.email || ''
  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 56,
      background: 'rgba(6, 15, 11, 0.88)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(111, 207, 151, 0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      zIndex: 100,
      fontFamily: 'Outfit, sans-serif',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="#6FCF97" stroke="#6FCF97" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ color: '#6FCF97', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>
          HiddenGems
        </span>
      </Link>

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(p => !p)}
          title="Account"
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: open ? 'rgba(111, 207, 151, 0.18)' : 'rgba(111, 207, 151, 0.08)',
            border: `1.5px solid ${open ? 'rgba(111, 207, 151, 0.45)' : 'rgba(111, 207, 151, 0.28)'}`,
            color: '#6FCF97',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {initials || '?'}
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 188,
            background: 'rgba(8, 20, 14, 0.97)',
            border: '1px solid rgba(111, 207, 151, 0.14)',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            overflow: 'hidden',
            zIndex: 200,
          }}>
            <div style={{
              padding: '10px 14px 9px',
              borderBottom: '1px solid rgba(111, 207, 151, 0.1)',
            }}>
              <div style={{ color: '#7a9a8a', fontSize: 11, lineHeight: 1.4 }}>{user?.email}</div>
            </div>

            {NAV_ITEMS.map(item => (
              <DropdownItem key={item.path} onClick={() => { setOpen(false); navigate(item.path) }}>
                {item.label}
              </DropdownItem>
            ))}

            <div style={{ height: 1, background: 'rgba(111, 207, 151, 0.1)', margin: '2px 0' }} />

            <DropdownItem onClick={handleSignOut} danger>
              Sign Out
            </DropdownItem>
          </div>
        )}
      </div>
    </div>
  )
}

function DropdownItem({ children, onClick, danger }: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'block',
        textAlign: 'left',
        padding: '9px 14px',
        background: hovered
          ? danger ? 'rgba(224, 85, 85, 0.09)' : 'rgba(111, 207, 151, 0.08)'
          : 'none',
        border: 'none',
        color: danger ? '#e05555' : '#EEEEEE',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 13,
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
    >
      {children}
    </button>
  )
}
