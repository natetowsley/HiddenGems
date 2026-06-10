import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPut } from '@/api/client'
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
@keyframes pg-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
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

interface Draft {
  name: string
  username: string
  avatarUrl: string | null
}

function ProfileCard({ profile }: { profile: UserResponse }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    name: profile.name,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
  })

  const mutation = useMutation({
    mutationFn: (d: Draft) =>
      apiPut<UserResponse>(`/api/users/${profile.id}`, {
        name: d.name.trim(),
        username: d.username.trim(),
        avatarUrl: d.avatarUrl?.trim() || null,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['users', 'me'], updated)
      setEditing(false)
    },
  })

  const isAdmin = profile.role === 'admin'
  const displayName = editing ? draft.name : profile.name
  const displayInitials = getInitials(displayName || profile.name)
  const displayAvatar = editing ? (draft.avatarUrl?.trim() || null) : profile.avatarUrl

  function handleEdit() {
    setDraft({ name: profile.name, username: profile.username, avatarUrl: profile.avatarUrl })
    mutation.reset()
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    mutation.reset()
  }

  function handleSave() {
    mutation.mutate(draft)
  }

  const canSave = draft.name.trim().length > 0 && draft.username.trim().length > 0 && !mutation.isPending

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
          position: 'relative',
          padding: '40px 32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottom: '1px solid rgba(111,207,151,0.08)',
          animation: 'pg-fadeUp 0.52s cubic-bezier(0.22,1,0.36,1) 0.07s both',
        }}>
          {!editing && <EditButton onClick={handleEdit} />}

          {/* Avatar */}
          <div style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            border: '2px solid rgba(111,207,151,0.32)',
            animation: editing ? 'none' : 'pg-ring-pulse 3.5s ease-in-out infinite',
            overflow: 'hidden',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: displayAvatar ? undefined : 'rgba(111,207,151,0.06)',
            flexShrink: 0,
          }}>
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
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
                {displayInitials || '?'}
              </span>
            )}
          </div>

          {/* Name */}
          {editing ? (
            <input
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              placeholder="Display name"
              maxLength={255}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1.5px solid rgba(111,207,151,0.35)',
                color: '#EEEEEE',
                fontSize: 27,
                fontWeight: 700,
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                textAlign: 'center',
                outline: 'none',
                width: '100%',
                marginBottom: 10,
                padding: '0 4px 6px',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderBottomColor = 'rgba(111,207,151,0.65)' }}
              onBlur={e => { e.currentTarget.style.borderBottomColor = 'rgba(111,207,151,0.35)' }}
            />
          ) : (
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
          )}

          {/* Username */}
          {editing ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              borderBottom: '1px solid rgba(111,207,151,0.3)',
              paddingBottom: 5,
            }}>
              <span style={{
                color: 'rgba(111,207,151,0.8)',
                fontSize: 13,
                fontWeight: 500,
                userSelect: 'none',
              }}>@</span>
              <input
                value={draft.username}
                onChange={e => setDraft(d => ({ ...d, username: e.target.value }))}
                placeholder="username"
                maxLength={255}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(111,207,151,0.9)',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'Outfit, sans-serif',
                  outline: 'none',
                  minWidth: 80,
                  letterSpacing: '0.01em',
                }}
              />
            </div>
          ) : (
            <div style={{
              color: 'rgba(111,207,151,0.8)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.01em',
              marginBottom: 16,
            }}>
              @{profile.username}
            </div>
          )}

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
          <DetailRow label="Email"  value={profile.email}            delay={0.18} last={false} />
          <DetailRow label="Joined" value={formatDate(profile.createdAt)} delay={0.25} last={!editing} />

          {editing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '13px 32px',
              animation: 'pg-fade-in 0.2s ease both',
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
                Avatar
              </span>
              <input
                value={draft.avatarUrl ?? ''}
                onChange={e => setDraft(d => ({ ...d, avatarUrl: e.target.value || null }))}
                placeholder="Image URL (optional)"
                style={{
                  flex: 1,
                  background: 'rgba(111,207,151,0.04)',
                  border: '1px solid rgba(111,207,151,0.18)',
                  borderRadius: 6,
                  color: '#EEEEEE',
                  fontSize: 12,
                  fontFamily: 'Outfit, sans-serif',
                  padding: '6px 10px',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(111,207,151,0.45)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(111,207,151,0.18)' }}
              />
            </div>
          )}
        </div>

        {/* Edit footer */}
        {editing && (
          <div style={{
            borderTop: '1px solid rgba(111,207,151,0.08)',
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'pg-fade-in 0.2s ease both',
          }}>
            {mutation.isError && (
              <span style={{ color: '#e05555', fontSize: 12, flex: 1 }}>
                {mutation.error instanceof Error && mutation.error.message.includes('409')
                  ? 'Username already taken.'
                  : 'Failed to save. Try again.'}
              </span>
            )}
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
              <CancelButton onClick={handleCancel} disabled={mutation.isPending} />
              <SaveButton onClick={handleSave} disabled={!canSave} loading={mutation.isPending} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Sub-components ---

function EditButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Edit profile"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        borderRadius: 6,
        color: hovered ? '#6FCF97' : '#3a5e4a',
        transition: 'color 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
  )
}

function CancelButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none',
        border: '1px solid rgba(111,207,151,0.15)',
        borderRadius: 8,
        color: hovered ? '#EEEEEE' : '#556a62',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 13,
        fontWeight: 500,
        padding: '7px 16px',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      Cancel
    </button>
  )
}

function SaveButton({ onClick, disabled, loading }: { onClick: () => void; disabled?: boolean; loading?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && !disabled ? 'rgba(111,207,151,0.18)' : 'rgba(111,207,151,0.1)',
        border: '1px solid rgba(111,207,151,0.35)',
        borderRadius: 8,
        color: disabled ? '#3a5e4a' : '#6FCF97',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        padding: '7px 18px',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        opacity: disabled ? 0.6 : 1,
        letterSpacing: '0.02em',
        minWidth: 106,
      }}
    >
      {loading ? 'Saving…' : 'Save changes'}
    </button>
  )
}

function DetailRow({
  label,
  value,
  last = false,
  delay = 0,
}: {
  label: string
  value: string
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
        color: '#EEEEEE',
        fontSize: 13,
        fontWeight: 500,
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
          {[1, 2].map(i => (
            <div key={i} style={{
              display: 'flex',
              gap: 24,
              padding: '14px 32px',
              borderBottom: i < 2 ? '1px solid rgba(111,207,151,0.06)' : 'none',
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
