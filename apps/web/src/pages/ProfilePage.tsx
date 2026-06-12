import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPut, apiPost } from '@/api/client'
import type { UserResponse, CollectionResponse, LocationResponse, LocationCategory } from '@/types'
import LocationSheet from '@/components/LocationSheet'

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
.pg-col-scroll::-webkit-scrollbar { height: 3px; }
.pg-col-scroll::-webkit-scrollbar-track { background: transparent; }
.pg-col-scroll::-webkit-scrollbar-thumb { background: rgba(111,207,151,0.15); border-radius: 999px; }
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

  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null)

  return (
    <>
      <style>{KEYFRAMES}</style>
      <LocationSheet location={selectedLocation} onClose={() => setSelectedLocation(null)} />
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
        flexDirection: 'column',
        alignItems: 'center',
        padding: '68px 20px 80px',
      }}>
        {isLoading ? (
          <SkeletonCard />
        ) : isError ? (
          <ErrorCard />
        ) : profile ? (
          <ProfileCard profile={profile} />
        ) : null}
        {profile && <CollectionsSection />}
        {profile && <LocationsSection profileId={profile.id} onSelect={setSelectedLocation} />}
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

// --- Collections section ---

function accentColor(title: string): string {
  const palette = ['#7EB8F7', '#F5A623', '#6FCF97', '#B88EF0', '#C4956A', '#F06B6B']
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return palette[h % palette.length]
}

function CollectionsSection() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPrivate, setNewPrivate] = useState(false)
  const [newHovered, setNewHovered] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let target = el.scrollLeft
    let rafId = 0

    const animate = () => {
      const diff = target - el.scrollLeft
      if (Math.abs(diff) < 0.5) { el.scrollLeft = target; return }
      el.scrollLeft += diff * 0.14
      rafId = requestAnimationFrame(animate)
    }

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return
      if (el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, target + e.deltaY))
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(animate)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel); cancelAnimationFrame(rafId) }
  }, [])

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => apiGet<CollectionResponse[]>('/api/collections'),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<CollectionResponse>('/api/collections', {
        title: newTitle.trim(),
        isPrivate: newPrivate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      setCreating(false)
      setNewTitle('')
      setNewPrivate(false)
    },
  })

  return (
    <div style={{
      width: '100%',
      maxWidth: 560,
      marginTop: 22,
      animation: 'pg-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.38s both',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: creating ? 12 : 14,
        paddingLeft: 2,
      }}>
        <span style={{
          color: '#3a5e4a',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
        }}>Collections</span>
        <span style={{
          fontSize: 9,
          color: '#6FCF97',
          background: 'rgba(111,207,151,0.08)',
          border: '1px solid rgba(111,207,151,0.12)',
          padding: '1px 7px',
          borderRadius: 10,
          fontVariantNumeric: 'tabular-nums',
        }}>{collections.length}</span>
      </div>

      {/* Inline create form */}
      {creating && (
        <div style={{
          marginBottom: 14,
          padding: '12px 14px',
          border: '1px solid rgba(111,207,151,0.12)',
          borderRadius: 10,
          background: 'rgba(9,23,17,0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'pg-fadeUp 0.18s ease both',
        }}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Collection name…"
            autoFocus
            maxLength={255}
            onKeyDown={e => {
              if (e.key === 'Enter' && newTitle.trim()) createMutation.mutate()
              if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
            }}
            style={{
              background: 'rgba(255,255,255,0.022)',
              border: '1px solid rgba(111,207,151,0.1)',
              borderRadius: 6,
              padding: '8px 11px',
              color: '#EEEEEE',
              fontSize: 13,
              fontFamily: 'Outfit, sans-serif',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box' as const,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(111,207,151,0.28)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(111,207,151,0.1)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PrivacyToggle value={newPrivate} onChange={setNewPrivate} />
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              <button
                onClick={() => { setCreating(false); setNewTitle('') }}
                style={{
                  padding: '5px 12px',
                  border: '1px solid rgba(111,207,151,0.07)',
                  borderRadius: 6,
                  background: 'transparent',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 11,
                  color: '#556a62',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >Cancel</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newTitle.trim() || createMutation.isPending}
                style={{
                  padding: '5px 14px',
                  border: '1px solid rgba(111,207,151,0.24)',
                  borderRadius: 6,
                  background: 'rgba(111,207,151,0.1)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: !newTitle.trim() || createMutation.isPending ? '#3a5e4a' : '#6FCF97',
                  cursor: !newTitle.trim() || createMutation.isPending ? 'default' : 'pointer',
                  letterSpacing: '0.04em',
                  opacity: !newTitle.trim() || createMutation.isPending ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >{createMutation.isPending ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal tiles row */}
      <div
        ref={scrollRef}
        className="pg-col-scroll"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(111,207,151,0.15) transparent',
        }}
      >
        {/* New collection tile */}
        <button
          onClick={() => setCreating(true)}
          onMouseEnter={() => setNewHovered(true)}
          onMouseLeave={() => setNewHovered(false)}
          style={{
            width: 128,
            height: 140,
            flexShrink: 0,
            borderRadius: 11,
            border: `1px dashed ${newHovered || creating ? 'rgba(111,207,151,0.38)' : 'rgba(111,207,151,0.16)'}`,
            background: newHovered || creating ? 'rgba(111,207,151,0.04)' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'border-color 0.15s, background 0.15s',
            scrollSnapAlign: 'start',
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'rgba(111,207,151,0.09)',
            border: '1px solid rgba(111,207,151,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6FCF97',
            transition: 'background 0.15s',
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 11,
            fontWeight: 500,
            color: '#3a5e4a',
            letterSpacing: '0.06em',
          }}>New</span>
        </button>

        {collections.map(col => (
          <CollectionTile key={col.id} collection={col} />
        ))}
      </div>
    </div>
  )
}

// --- Locations section ---

const CATEGORY_COLOR: Record<LocationCategory, string> = {
  study_spot: '#7EB8F7',
  food:       '#F5A623',
  scenic:     '#6FCF97',
  hangout:    '#B88EF0',
  trail:      '#C4956A',
  activity:   '#F06B6B',
  other:      '#8899AA',
}

const CATEGORY_LABEL: Record<LocationCategory, string> = {
  study_spot: 'Study Spot',
  food:       'Food & Drink',
  scenic:     'Scenic',
  hangout:    'Hangout',
  trail:      'Trail',
  activity:   'Activity',
  other:      'Other',
}

function LocationsSection({ profileId, onSelect }: { profileId: string; onSelect: (loc: LocationResponse) => void }) {
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['userLocations', profileId],
    queryFn: () => apiGet<LocationResponse[]>(`/api/users/${profileId}/locations`),
  })

  return (
    <div style={{
      width: '100%',
      maxWidth: 560,
      marginTop: 22,
      animation: 'pg-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.48s both',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        paddingLeft: 2,
      }}>
        <span style={{
          color: '#3a5e4a',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
        }}>My Locations</span>
        <span style={{
          fontSize: 9,
          color: '#6FCF97',
          background: 'rgba(111,207,151,0.08)',
          border: '1px solid rgba(111,207,151,0.12)',
          padding: '1px 7px',
          borderRadius: 10,
          fontVariantNumeric: 'tabular-nums',
        }}>{locations.length}</span>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 54,
              borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(111,207,151,0.04) 25%, rgba(111,207,151,0.08) 50%, rgba(111,207,151,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: `pg-shimmer 1.7s linear ${i * 0.1}s infinite`,
            }} />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '28px 0',
          color: '#3a5e4a',
          fontSize: 12,
          letterSpacing: '0.04em',
        }}>
          No locations yet.
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxHeight: 340,
          overflowY: 'auto',
          paddingRight: 4,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(111,207,151,0.15) transparent',
        }}>
          {locations.map((loc, i) => (
            <LocationRow key={loc.id} location={loc} index={i} onSelect={() => onSelect(loc)} />
          ))}
        </div>
      )}
    </div>
  )
}

function LocationRow({ location, index, onSelect }: { location: LocationResponse; index: number; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)
  const color = CATEGORY_COLOR[location.category]

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        border: `1px solid ${hovered ? `${color}22` : 'rgba(111,207,151,0.07)'}`,
        background: hovered ? 'rgba(9,23,17,0.7)' : 'rgba(9,23,17,0.4)',
        transition: 'border-color 0.15s, background 0.15s',
        animation: `pg-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${0.48 + index * 0.04}s both`,
        cursor: 'pointer',
      }}
    >
      {/* Category dot */}
      <div style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />

      {/* Name + category */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#EEEEEE',
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
          marginBottom: 2,
        }}>
          {location.name}
        </div>
        <div style={{
          fontSize: 9,
          color: '#3a5e4a',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          {CATEGORY_LABEL[location.category]}
        </div>
      </div>

      {/* Right: rating · private · pending */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ color: '#F5A623', fontSize: 9 }}>★</span>
          <span style={{ fontSize: 10, color: '#556a62', letterSpacing: '0.04em' }}>
            {Number(location.avgRating).toFixed(1)}
          </span>
        </div>

        {location.isPrivate && (
          <svg width="9" height="9" viewBox="0 0 8 8" fill="none" style={{ color: '#3a5e4a' }}>
            <rect x="1" y="3.5" width="6" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1" />
            <path d="M2.2 3.5V2.4a1.8 1.8 0 013.6 0v1.1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        )}

        {location.status === 'pending' && (
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#F5A623',
            background: 'rgba(245,166,35,0.08)',
            border: '1px solid rgba(245,166,35,0.18)',
            padding: '2px 6px',
            borderRadius: 4,
          }}>
            Pending
          </span>
        )}
      </div>
    </div>
  )
}

function PrivacyToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => onChange(!value)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        border: `1px solid ${value ? 'rgba(111,207,151,0.26)' : hovered ? 'rgba(111,207,151,0.16)' : 'rgba(111,207,151,0.1)'}`,
        borderRadius: 5,
        background: value ? 'rgba(111,207,151,0.06)' : 'transparent',
        color: value ? '#6FCF97' : hovered ? '#9aada5' : '#556a62',
        fontSize: 10.5,
        fontFamily: 'Outfit, sans-serif',
        cursor: 'pointer',
        letterSpacing: '0.04em',
        transition: 'all 0.15s',
      }}
    >
      {value ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1.5" y="4.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" />
          <path d="M3 4.5v-1a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1.5" y="4.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" />
          <path d="M3 4.5v-1a2 2 0 014 0v1M7 4.5V3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      )}
      {value ? 'Private' : 'Public'}
    </button>
  )
}

function CollectionTile({ collection }: { collection: CollectionResponse }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const color = accentColor(collection.title)
  const count = collection.locationIds.length

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/collections/${collection.id}`)}
      style={{
        width: 128,
        height: 140,
        flexShrink: 0,
        borderRadius: 11,
        border: `1px solid ${hovered ? `${color}35` : 'rgba(111,207,151,0.07)'}`,
        background: hovered ? `${color}0c` : 'rgba(255,255,255,0.018)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'border-color 0.15s, background 0.15s',
        scrollSnapAlign: 'start',
        textAlign: 'left',
        padding: 0,
      }}
    >
      {/* Color section */}
      <div style={{
        flex: 1,
        background: `${color}14`,
        borderBottom: `1px solid ${color}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 7px)',
          pointerEvents: 'none',
        }} />
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 28,
          fontWeight: 800,
          color,
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
        }}>
          {collection.title[0].toUpperCase()}
        </span>
        {collection.isPrivate && (
          <div style={{
            position: 'absolute',
            top: 6,
            right: 7,
            color: `${color}88`,
          }}>
            <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
              <rect x="1" y="3.5" width="6" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1" />
              <path d="M2.2 3.5V2.4a1.8 1.8 0 013.6 0v1.1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Title / count */}
      <div style={{ padding: '7px 10px 8px', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: '#EEEEEE',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '0.01em',
          lineHeight: 1.2,
          marginBottom: 3,
        }}>
          {collection.title}
        </div>
        <div style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 10,
          color: '#2d5248',
          letterSpacing: '0.04em',
        }}>
          {count} {count === 1 ? 'place' : 'places'}
        </div>
      </div>
    </button>
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
