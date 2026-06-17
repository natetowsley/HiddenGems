import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@/api/client'
import type { CollectionResponse } from '@/types'
import './AddToCollectionModal.css'

function accentColor(title: string): string {
  const palette = ['#7EB8F7', '#F5A623', '#6FCF97', '#B88EF0', '#C4956A', '#F06B6B']
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return palette[h % palette.length]
}

interface Props {
  locationId: string
  isOpen: boolean
  onClose: () => void
}

export default function AddToCollectionModal({ locationId, isOpen, onClose }: Props) {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPrivate, setNewPrivate] = useState(false)
  // Fix #8: track which collection IDs have an in-flight mutation
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => apiGet<CollectionResponse[]>('/api/collections'),
    enabled: isOpen,
  })

  // Fix #8: single mutation with per-collection pending tracking replaces the
  // old addMutation + removeMutation pair, preventing rapid-click desyncs
  const toggleMutation = useMutation({
    mutationFn: ({ collectionId, adding }: { collectionId: string; adding: boolean }) =>
      adding
        ? apiPost<CollectionResponse>(`/api/collections/${collectionId}/items`, { locationId })
        : apiDelete(`/api/collections/${collectionId}/items/${locationId}`),
    onMutate: ({ collectionId }) => {
      setPendingIds(prev => new Set(prev).add(collectionId))
    },
    onSettled: (_, __, { collectionId }) => {
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(collectionId)
        return next
      })
      qc.invalidateQueries({ queryKey: ['collections'] })
    },
  })

  // Fix #5: if adding the location fails, delete the just-created collection
  // so we don't leave behind an empty orphan the user never intended to keep
  const createMutation = useMutation({
    mutationFn: async () => {
      const col = await apiPost<CollectionResponse>('/api/collections', {
        title: newTitle.trim(),
        isPrivate: newPrivate,
      })
      try {
        await apiPost<CollectionResponse>(`/api/collections/${col.id}/items`, { locationId })
      } catch (err) {
        await apiDelete(`/api/collections/${col.id}`).catch(() => {})
        throw err
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      setCreating(false)
      setNewTitle('')
      setNewPrivate(false)
    },
  })

  function toggle(col: CollectionResponse) {
    if (pendingIds.has(col.id)) return
    const adding = !col.locationIds.includes(locationId)
    toggleMutation.mutate({ collectionId: col.id, adding })
  }

  if (!isOpen) return null

  return (
    <div className="atcm-backdrop" onClick={onClose}>
      <div className="atcm-modal" onClick={e => e.stopPropagation()}>

        <div className="atcm-header">
          <span className="atcm-title">Add to Collection</span>
          <button className="atcm-close" onClick={onClose} aria-label="Close">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="#EEEEEE" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="atcm-body">

          {creating ? (
            <div className="atcm-create-form">
              <input
                className="atcm-input"
                placeholder="Collection name…"
                value={newTitle}
                autoFocus
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTitle.trim()) createMutation.mutate()
                  if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
                }}
              />
              <div className="atcm-form-row">
                <button
                  className={`atcm-privacy-toggle${newPrivate ? ' on' : ''}`}
                  onClick={() => setNewPrivate(v => !v)}
                  type="button"
                >
                  {newPrivate ? (
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
                  {newPrivate ? 'Private' : 'Public'}
                </button>
                <div className="atcm-form-btns">
                  <button
                    className="atcm-btn-ghost"
                    onClick={() => { setCreating(false); setNewTitle('') }}
                  >
                    Cancel
                  </button>
                  <button
                    className="atcm-btn-primary"
                    disabled={!newTitle.trim() || createMutation.isPending}
                    onClick={() => createMutation.mutate()}
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create & Add'}
                  </button>
                </div>
              </div>
              {createMutation.isError && (
                <p style={{ color: '#e05555', fontSize: 11, margin: '8px 0 0', fontFamily: 'Outfit, sans-serif' }}>
                  Failed to add location. Try again.
                </p>
              )}
            </div>
          ) : (
            <button className="atcm-new-row" onClick={() => setCreating(true)}>
              <span className="atcm-new-icon">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="atcm-new-label">New Collection</span>
            </button>
          )}

          <div className="atcm-sep" />

          {isLoading ? (
            <div className="atcm-loading">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="atcm-skeleton"
                  style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}
                />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <p className="atcm-empty">No collections yet. Create one above.</p>
          ) : (
            <ul className="atcm-list">
              {collections.map(col => {
                const color = accentColor(col.title)
                const inCollection = col.locationIds.includes(locationId)
                const isPending = pendingIds.has(col.id)
                return (
                  <li key={col.id}>
                    <button
                      className={`atcm-item${inCollection ? ' atcm-item--in' : ''}`}
                      onClick={() => toggle(col)}
                      disabled={isPending}
                      style={isPending ? { opacity: 0.5, cursor: 'default' } : undefined}
                    >
                      <div
                        className="atcm-thumb"
                        style={{
                          background: `${color}14`,
                          borderColor: `${color}33`,
                        }}
                      >
                        <span className="atcm-thumb-letter" style={{ color }}>
                          {col.title[0].toUpperCase()}
                        </span>
                      </div>

                      <div className="atcm-item-text">
                        <span className="atcm-item-name">{col.title}</span>
                        <span className="atcm-item-sub">
                          {col.locationIds.length}{' '}
                          {col.locationIds.length === 1 ? 'place' : 'places'}
                          {col.isPrivate && (
                            <>
                              {' · '}
                              <svg
                                width="8"
                                height="8"
                                viewBox="0 0 8 8"
                                fill="none"
                                style={{ display: 'inline', verticalAlign: 'middle', marginBottom: 1 }}
                              >
                                <rect x="1" y="3.5" width="6" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1" />
                                <path d="M2.2 3.5V2.4a1.8 1.8 0 013.6 0v1.1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                              </svg>
                              {' private'}
                            </>
                          )}
                        </span>
                      </div>

                      <div className={`atcm-check${inCollection ? ' atcm-check--on' : ''}`}>
                        {inCollection ? (
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="9" r="8" fill="#6FCF97" />
                            <path d="M5.5 9l2.5 2.5L12.5 6" stroke="#060f0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="9" r="7.5" stroke="#1e3b30" strokeWidth="1" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
