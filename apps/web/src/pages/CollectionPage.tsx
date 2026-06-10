import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPut } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import type { CollectionResponse, LocationCategory, LocationResponse, PublicUserResponse } from '@/types'

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

function accentColor(title: string): string {
  const palette = ['#7EB8F7', '#F5A623', '#6FCF97', '#B88EF0', '#C4956A', '#F06B6B']
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return palette[h % palette.length]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#F5A623' : '#1e3b30', fontSize: 9 }}>★</span>
      ))}
    </span>
  )
}

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: collection, isLoading: collLoading, isError, error } = useQuery({
    queryKey: ['collections', id],
    queryFn: () => apiGet<CollectionResponse>(`/api/collections/${id}`),
    enabled: !!id,
    retry: false,
  })

  const locationQueries = useQueries({
    queries: (collection?.locationIds ?? []).map(locId => ({
      queryKey: ['location', locId],
      queryFn: () => apiGet<LocationResponse>(`/api/locations/${locId}`),
      enabled: !!collection,
    })),
  })

  const locations = locationQueries.filter(q => q.data).map(q => q.data!)
  const locLoading = locationQueries.some(q => q.isLoading)
  const isLoading = collLoading || (!!collection && collection.locationIds.length > 0 && locLoading)

  const { data: owner } = useQuery({
    queryKey: ['user', collection?.userId],
    queryFn: () => apiGet<PublicUserResponse>(`/api/users/${collection!.userId}`),
    enabled: !!collection,
  })

  const color = collection ? accentColor(collection.title) : '#6FCF97'
  const isOwner = !!user && !!collection && collection.userId === user.id
  const is403 = isError && error instanceof Error && error.message.startsWith('403')
  const is404 = isError && !is403

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      paddingTop: 56,
      backgroundColor: '#060f0b',
      backgroundImage: [
        'radial-gradient(circle, rgba(111,207,151,0.032) 1px, transparent 1px)',
      ].join(', '),
      backgroundSize: '30px 30px',
      backgroundRepeat: 'repeat',
      fontFamily: 'Outfit, sans-serif',
    }}>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '36px 24px 80px',
      }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: '#3a5e4a',
            fontSize: 11,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 32,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#6FCF97' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3a5e4a' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {is403 ? (
          <PrivateCollectionState />
        ) : is404 ? (
          <NotFoundState />
        ) : (
          <>
            {/* Header */}
            {isLoading || !collection ? (
              <HeaderSkeleton />
            ) : (
              <CollectionHeader collection={collection} color={color} isOwner={isOwner} owner={owner} />
            )}

            <div style={{
              height: 1,
              background: 'rgba(111,207,151,0.06)',
              margin: '32px 0',
            }} />

            {/* Locations grid */}
            {isLoading ? (
              <LocationsGridSkeleton count={collection?.locationIds.length ?? 4} />
            ) : collection && collection.locationIds.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}>
                {locations.map((loc, i) => (
                  <LocationCard key={loc.id} location={loc} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CollectionHeader({
  collection,
  color,
  isOwner,
  owner,
}: {
  collection: CollectionResponse
  color: string
  isOwner: boolean
  owner?: PublicUserResponse
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: collection.title, isPrivate: collection.isPrivate })

  const mutation = useMutation({
    mutationFn: () =>
      apiPut<CollectionResponse>(`/api/collections/${collection.id}`, {
        title: draft.title.trim(),
        isPrivate: draft.isPrivate,
      }),
    onSuccess: updated => {
      qc.setQueryData(['collections', collection.id], updated)
      // also update the collections list cache so the profile tile reflects changes
      qc.invalidateQueries({ queryKey: ['collections'] })
      setEditing(false)
    },
  })

  function startEdit() {
    setDraft({ title: collection.title, isPrivate: collection.isPrivate })
    mutation.reset()
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    mutation.reset()
  }

  const displayTitle = editing ? draft.title : collection.title
  const displayPrivate = editing ? draft.isPrivate : collection.isPrivate
  const ghostLetter = (displayTitle[0] ?? collection.title[0]).toUpperCase()
  const liveColor = editing ? accentColor(draft.title || collection.title) : color
  const canSave = draft.title.trim().length > 0 && !mutation.isPending

  return (
    <div style={{ position: 'relative' }}>
      {/* Ghost initial watermark */}
      <div style={{
        position: 'absolute',
        top: -16,
        left: -8,
        fontFamily: 'Syne, sans-serif',
        fontSize: 160,
        fontWeight: 800,
        color: liveColor,
        opacity: 0.05,
        lineHeight: 1,
        userSelect: 'none',
        pointerEvents: 'none',
        letterSpacing: '-0.05em',
        transition: 'color 0.2s',
      }}>
        {ghostLetter}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Edit button — owner only, view mode only */}
        {isOwner && !editing && (
          <button
            onClick={startEdit}
            title="Edit collection"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: '#3a5e4a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#6FCF97' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#3a5e4a' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}

        {/* Privacy badge / toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {editing ? (
            <button
              onClick={() => setDraft(d => ({ ...d, isPrivate: !d.isPrivate }))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: draft.isPrivate ? '#556a62' : '#6FCF97',
                background: draft.isPrivate ? 'rgba(85,106,98,0.1)' : 'rgba(111,207,151,0.1)',
                border: `1px solid ${draft.isPrivate ? 'rgba(85,106,98,0.28)' : 'rgba(111,207,151,0.28)'}`,
                padding: '3px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                transition: 'color 0.15s, background 0.15s, border-color 0.15s',
              }}
            >
              {draft.isPrivate ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <rect x="1" y="3.5" width="6" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1"/>
                  <path d="M2.2 3.5V2.4a1.8 1.8 0 013.6 0v1.1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <rect x="1" y="3.5" width="6" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1"/>
                  <path d="M2.2 3.5V2.4a1.8 1.8 0 013.6 0v1.1M6 3.5V3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              )}
              {draft.isPrivate ? 'Private' : 'Public'}
            </button>
          ) : (
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: displayPrivate ? '#556a62' : '#6FCF97',
              background: displayPrivate ? 'rgba(85,106,98,0.08)' : 'rgba(111,207,151,0.08)',
              border: `1px solid ${displayPrivate ? 'rgba(85,106,98,0.2)' : 'rgba(111,207,151,0.2)'}`,
              padding: '2px 9px',
              borderRadius: 4,
            }}>
              {displayPrivate ? 'Private' : 'Public'}
            </span>
          )}
        </div>

        {/* Title */}
        {editing ? (
          <input
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            autoFocus
            maxLength={255}
            onKeyDown={e => {
              if (e.key === 'Enter' && canSave) mutation.mutate()
              if (e.key === 'Escape') cancel()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid rgba(111,207,151,0.35)',
              color: '#EEEEEE',
              fontFamily: 'Syne, sans-serif',
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              outline: 'none',
              width: '100%',
              marginBottom: 14,
              padding: '0 0 6px',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderBottomColor = 'rgba(111,207,151,0.65)' }}
            onBlur={e => { e.currentTarget.style.borderBottomColor = 'rgba(111,207,151,0.35)' }}
          />
        ) : (
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 38,
            fontWeight: 800,
            color: '#EEEEEE',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            margin: '0 0 14px',
          }}>
            {collection.title}
          </h1>
        )}

        {/* Owner row — TODO: navigate to /users/${owner?.id} when public profiles exist */}
        <button
          onClick={() => {}}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            marginBottom: 14,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            const span = e.currentTarget.querySelector('span') as HTMLElement | null
            if (span) span.style.color = '#EEEEEE'
          }}
          onMouseLeave={e => {
            const span = e.currentTarget.querySelector('span') as HTMLElement | null
            if (span) span.style.color = '#556a62'
          }}
        >
          <div style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'rgba(111,207,151,0.08)',
            border: '1px solid rgba(111,207,151,0.12)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {owner?.avatarUrl ? (
              <img
                src={owner.avatarUrl}
                alt={owner.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                color: '#6FCF97',
              }}>
                {owner?.username?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <span style={{
            fontSize: 11,
            color: '#556a62',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '0.04em',
            transition: 'color 0.15s',
          }}>
            @{owner?.username ?? '…'}
          </span>
        </button>

        {/* Meta row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          letterSpacing: '0.06em',
        }}>
          <span style={{ color: '#556a62' }}>
            {collection.locationIds.length}{' '}
            {collection.locationIds.length === 1 ? 'place' : 'places'}
          </span>
          <span style={{ color: '#3a5e4a' }}>·</span>
          <span style={{ color: '#3a5e4a' }}>Created {formatDate(collection.createdAt)}</span>
        </div>

        {/* Edit action row */}
        {editing && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 20,
            animation: 'cp-fadeUp 0.18s ease both',
          }}>
            {mutation.isError && (
              <span style={{ color: '#e05555', fontSize: 12, flex: 1 }}>
                Failed to save. Try again.
              </span>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={cancel}
                disabled={mutation.isPending}
                style={{
                  padding: '7px 16px',
                  border: '1px solid rgba(111,207,151,0.15)',
                  borderRadius: 8,
                  background: 'none',
                  color: '#556a62',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#EEEEEE' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#556a62' }}
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={!canSave}
                style={{
                  padding: '7px 18px',
                  border: '1px solid rgba(111,207,151,0.35)',
                  borderRadius: 8,
                  background: canSave ? 'rgba(111,207,151,0.1)' : 'transparent',
                  color: canSave ? '#6FCF97' : '#3a5e4a',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: canSave ? 'pointer' : 'default',
                  letterSpacing: '0.02em',
                  transition: 'background 0.15s, color 0.15s',
                  opacity: canSave ? 1 : 0.6,
                  minWidth: 100,
                }}
              >
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LocationCard({ location, index }: { location: LocationResponse; index: number }) {
  const [hovered, setHovered] = useState(false)
  const color = CATEGORY_COLOR[location.category]
  const snippet = location.description
    ? location.description.slice(0, 72) + (location.description.length > 72 ? '…' : '')
    : null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(9,23,17,0.9)' : 'rgba(9,23,17,0.7)',
        border: `1px solid ${hovered ? `${color}28` : 'rgba(111,207,151,0.07)'}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex',
        flexDirection: 'column',
        animation: `cp-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 0.04}s both`,
      }}
    >
      {/* Category color bar */}
      <div style={{ height: 3, background: color, flexShrink: 0 }} />

      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Badge row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 8.5,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color,
          }}>
            {CATEGORY_LABEL[location.category]}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Stars rating={location.avgRating} />
            <span style={{ fontSize: 10, color: '#556a62', letterSpacing: '0.04em' }}>
              {location.avgRating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Name */}
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 14,
          fontWeight: 700,
          color: '#EEEEEE',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          {location.name}
        </div>

        {/* Description */}
        {snippet && (
          <div style={{
            fontSize: 11.5,
            color: '#556a62',
            lineHeight: 1.6,
            flex: 1,
          }}>
            {snippet}
          </div>
        )}

        {/* Tags */}
        {location.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {location.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: 9,
                color: '#2d5248',
                background: 'rgba(45,82,72,0.18)',
                border: '1px solid rgba(45,82,72,0.35)',
                padding: '2px 7px',
                borderRadius: 20,
                letterSpacing: '0.04em',
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()
  return (
    <div style={{
      textAlign: 'center',
      padding: '56px 32px',
    }}>
      <div style={{
        color: '#2d5248',
        fontSize: 32,
        marginBottom: 16,
        lineHeight: 1,
      }}>◈</div>
      <div style={{ color: '#EEEEEE', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
        Nothing here yet
      </div>
      <div style={{ color: '#3a5e4a', fontSize: 12, marginBottom: 24, lineHeight: 1.6 }}>
        Add locations to this collection from the map.
      </div>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '8px 20px',
          border: '1px solid rgba(111,207,151,0.24)',
          borderRadius: 8,
          background: 'rgba(111,207,151,0.08)',
          color: '#6FCF97',
          fontSize: 12,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 500,
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
      >
        Explore the map
      </button>
    </div>
  )
}

// --- Error states ---

function PrivateCollectionState() {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px', animation: 'cp-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'rgba(85,106,98,0.08)',
        border: '1px solid rgba(85,106,98,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        color: '#556a62',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 18,
        fontWeight: 700,
        color: '#EEEEEE',
        marginBottom: 10,
        letterSpacing: '-0.02em',
      }}>
        Private Collection
      </div>
      <div style={{
        fontSize: 13,
        color: '#3a5e4a',
        lineHeight: 1.65,
        maxWidth: 300,
        margin: '0 auto 28px',
      }}>
        This collection is private and can only be viewed by its owner.
      </div>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 20px',
          border: '1px solid rgba(111,207,151,0.16)',
          borderRadius: 8,
          background: 'transparent',
          color: '#556a62',
          fontSize: 12,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 500,
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
      >
        Go back
      </button>
    </div>
  )
}

function NotFoundState() {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px', animation: 'cp-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{ color: '#2d5248', fontSize: 28, marginBottom: 16, lineHeight: 1 }}>◈</div>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 18,
        fontWeight: 700,
        color: '#EEEEEE',
        marginBottom: 10,
        letterSpacing: '-0.02em',
      }}>
        Collection not found
      </div>
      <div style={{
        fontSize: 13,
        color: '#3a5e4a',
        lineHeight: 1.65,
        maxWidth: 280,
        margin: '0 auto 28px',
      }}>
        This link may be broken or the collection may have been deleted.
      </div>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 20px',
          border: '1px solid rgba(111,207,151,0.16)',
          borderRadius: 8,
          background: 'transparent',
          color: '#556a62',
          fontSize: 12,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 500,
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
      >
        Go back
      </button>
    </div>
  )
}

// --- Skeletons ---

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(111,207,151,0.04) 25%, rgba(111,207,151,0.08) 50%, rgba(111,207,151,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'cp-shimmer 1.7s linear infinite',
  borderRadius: 6,
}

function HeaderSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...SHIMMER, width: 56, height: 18, borderRadius: 4 }} />
      <div style={{ ...SHIMMER, width: '55%', height: 38, borderRadius: 8 }} />
      <div style={{ ...SHIMMER, width: '30%', height: 11 }} />
    </div>
  )
}

function LocationsGridSkeleton({ count }: { count: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 12,
    }}>
      {Array.from({ length: Math.max(count, 3) }).map((_, i) => (
        <div key={i} style={{
          ...SHIMMER,
          height: 150,
          borderRadius: 10,
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
    </div>
  )
}

// Inject keyframes
const STYLE = `
@keyframes cp-fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cp-shimmer {
  from { background-position: 200% center; }
  to   { background-position: -200% center; }
}
`

// Append styles once
if (!document.getElementById('cp-styles')) {
  const el = document.createElement('style')
  el.id = 'cp-styles'
  el.textContent = STYLE
  document.head.appendChild(el)
}
