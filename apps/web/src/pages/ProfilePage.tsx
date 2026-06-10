import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/api/client'
import type { UserResponse } from '@/types'

const KEYFRAMES = `
@keyframes pg-fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes pg-shimmer {
  from { background-position: 200% center; }
  to   { background-position: -200% center; }
}
@keyframes pg-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(111,207,151,0.07), 0 0 24px rgba(111,207,151,0.09); }
  50%       { box-shadow: 0 0 0 4px rgba(111,207,151,0.14), 0 0 32px rgba(111,207,151,0.15); }
}
`

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => apiGet<UserResponse>('/api/users/me'),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        paddingTop: 56,
        backgroundColor: '#060f0b',
        backgroundImage: [
          'radial-gradient(ellipse 80% 38% at 50% 0%, rgba(111,207,151,0.05) 0%, transparent 100%)',
          'radial-gradient(circle, rgba(111,207,151,0.032) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '100% 100%, 30px 30px',
        backgroundRepeat: 'no-repeat, repeat',
        fontFamily: 'Outfit, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        padding: '68px 20px 80px',
      }}>
        {isLoading ? (
          <SkeletonCard />
        ) : isError ? (
          <ErrorCard />
        ) : profile ? (
          <ProfileCard profile={profile} />
        ) : null}
      </div>
    </>
  )
}

function ProfileCard({ profile }: { profile: UserResponse }) {
  const initials = getInitials(profile.name)
  const isAdmin = profile.role === 'admin'

  const rows = [
    { label: 'Email',  value: profile.email,                         mono: false, muted: false },
    { label: 'Joined', value: formatDate(profile.createdAt),          mono: false, muted: false },
    { label: 'ID',     value: profile.id.split('-')[0].toUpperCase(), mono: true,  muted: true  },
  ]

  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      {/* Section label */}
      <div style={{
        textAlign: 'center',
        color: '#3a5e4a',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        marginBottom: 24,
        animation: 'pg-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        Explorer Profile
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(9, 23, 17, 0.8)',
        border: '1px solid rgba(111,207,151,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(111,207,151,0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}>
        {/* Identity section */}
        <div style={{
          padding: '40px 32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottom: '1px solid rgba(111,207,151,0.08)',
          animation: 'pg-fadeUp 0.52s cubic-bezier(0.22,1,0.36,1) 0.07s both',
        }}>
          {/* Avatar */}
          <div style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            border: '2px solid rgba(111,207,151,0.32)',
            animation: 'pg-ring-pulse 3.5s ease-in-out infinite',
            overflow: 'hidden',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: profile.avatarUrl ? undefined : 'rgba(111,207,151,0.06)',
            flexShrink: 0,
          }}>
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{
                color: '#6FCF97',
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}>
                {initials || '?'}
              </span>
            )}
          </div>

          {/* Name */}
          <div style={{
            color: '#EEEEEE',
            fontSize: 27,
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            marginBottom: 7,
            textAlign: 'center',
          }}>
            {profile.name}
          </div>

          {/* Username */}
          <div style={{
            color: 'rgba(111,207,151,0.8)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.01em',
            marginBottom: 16,
          }}>
            @{profile.username}
          </div>

          {/* Role badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 11px 3px 9px',
            borderRadius: 20,
            background: isAdmin ? 'rgba(255,180,50,0.07)' : 'rgba(111,207,151,0.06)',
            border: `1px solid ${isAdmin ? 'rgba(255,180,50,0.25)' : 'rgba(111,207,151,0.2)'}`,
            color: isAdmin ? '#ffb432' : '#6FCF97',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            <span style={{ fontSize: 8, opacity: 0.9 }}>{isAdmin ? '✦' : '◈'}</span>
            {isAdmin ? 'Admin' : 'Explorer'}
          </div>
        </div>

        {/* Detail rows */}
        <div>
          {rows.map((row, i) => (
            <DetailRow
              key={row.label}
              label={row.label}
              value={row.value}
              mono={row.mono}
              muted={row.muted}
              last={i === rows.length - 1}
              delay={0.18 + i * 0.07}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
  muted = false,
  last = false,
  delay = 0,
}: {
  label: string
  value: string
  mono?: boolean
  muted?: boolean
  last?: boolean
  delay?: number
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '14px 32px',
      borderBottom: last ? 'none' : '1px solid rgba(111,207,151,0.06)',
      animation: `pg-fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
    }}>
      <span style={{
        color: '#3a5e4a',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        width: 64,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        color: muted ? '#556a62' : '#EEEEEE',
        fontSize: mono ? 11 : 13,
        fontFamily: mono ? '"Courier New", Courier, monospace' : 'Outfit, sans-serif',
        fontWeight: mono ? 400 : 500,
        letterSpacing: mono ? '0.08em' : 'normal',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  )
}

const SHIMMER_STYLE: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(111,207,151,0.04) 25%, rgba(111,207,151,0.08) 50%, rgba(111,207,151,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'pg-shimmer 1.7s linear infinite',
  borderRadius: 6,
}

function SkeletonCard() {
  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <div style={{
        background: 'rgba(9, 23, 17, 0.8)',
        border: '1px solid rgba(111,207,151,0.1)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '40px 32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          borderBottom: '1px solid rgba(111,207,151,0.08)',
        }}>
          <div style={{ ...SHIMMER_STYLE, width: 90, height: 90, borderRadius: '50%' }} />
          <div style={{ ...SHIMMER_STYLE, width: 170, height: 22 }} />
          <div style={{ ...SHIMMER_STYLE, width: 100, height: 13 }} />
          <div style={{ ...SHIMMER_STYLE, width: 76, height: 22, borderRadius: 20 }} />
        </div>
        <div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              display: 'flex',
              gap: 24,
              padding: '14px 32px',
              borderBottom: i < 3 ? '1px solid rgba(111,207,151,0.06)' : 'none',
            }}>
              <div style={{ ...SHIMMER_STYLE, width: 44, height: 11 }} />
              <div style={{ ...SHIMMER_STYLE, width: 120 + i * 20, height: 11 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorCard() {
  return (
    <div style={{
      width: '100%',
      maxWidth: 460,
      textAlign: 'center',
      padding: '56px 32px',
      background: 'rgba(9, 23, 17, 0.8)',
      border: '1px solid rgba(111,207,151,0.1)',
      borderRadius: 16,
      animation: 'pg-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <div style={{ color: '#EEEEEE', fontSize: 15, fontWeight: 600, marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>
        Unable to load profile
      </div>
      <div style={{ color: '#556a62', fontSize: 13, fontFamily: 'Outfit, sans-serif' }}>
        Please try refreshing the page.
      </div>
    </div>
  )
}
