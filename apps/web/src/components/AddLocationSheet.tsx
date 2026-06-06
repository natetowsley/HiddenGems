import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/api/client'
import type { LocationCategory } from '@/types'
import './AddLocationSheet.css'

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

const CATEGORY_ICON: Record<LocationCategory, React.ReactNode> = {
  scenic: <path d="M10 4L15 14H5L10 4Z" fill="currentColor" fillOpacity="0.9" />,
  food: (
    <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none">
      <line x1="10" y1="5" x2="10" y2="15" />
      <line x1="8" y1="5" x2="8" y2="8" />
      <line x1="12" y1="5" x2="12" y2="8" />
      <path d="M8 8Q10 9 12 8" />
    </g>
  ),
  study_spot: (
    <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M10 5C9 4.5 6.5 5 6 6L6 15C6.5 14 9 13.5 10 14" />
      <path d="M10 5C11 4.5 13.5 5 14 6L14 15C13.5 14 11 13.5 10 14" />
      <line x1="10" y1="5" x2="10" y2="14" />
    </g>
  ),
  hangout: (
    <g fill="currentColor" fillOpacity="0.9">
      <circle cx="10" cy="7" r="2.5" />
      <path d="M5 15C5 12 7.2 10 10 10S15 12 15 15Z" />
    </g>
  ),
  trail: (
    <g fill="currentColor" fillOpacity="0.9">
      <ellipse cx="7.5" cy="8" rx="1.8" ry="2.5" transform="rotate(-20 7.5 8)" />
      <ellipse cx="12.5" cy="13" rx="1.8" ry="2.5" transform="rotate(20 12.5 13)" />
    </g>
  ),
  activity: <path d="M12 4H8.5L7 10H10L8 16L15 9H11.5L12 4Z" fill="currentColor" fillOpacity="0.9" />,
  other: <path d="M10 4L11 8.5L15.5 10L11 11.5L10 16L9 11.5L4.5 10L9 8.5Z" fill="currentColor" fillOpacity="0.9" />,
}

interface Props {
  coords: { lat: number; lng: number } | null
  onClose: () => void
}

export default function AddLocationSheet({ coords, onClose }: Props) {
  const queryClient = useQueryClient()
  const isOpen = coords !== null

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]       = useState<LocationCategory | null>(null)
  const [tags, setTags]               = useState<string[]>([])
  const [tagInput, setTagInput]       = useState('')
  const [isPrivate, setIsPrivate]     = useState(false)

  const mutation = useMutation({
    mutationFn: () => apiPost('/api/locations', {
      name: name.trim(),
      description: description.trim() || null,
      category,
      tags,
      lat: coords!.lat,
      lng: coords!.lng,
      isPrivate,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      resetAndClose()
    },
  })

  function resetAndClose() {
    setName('')
    setDescription('')
    setCategory(null)
    setTags([])
    setTagInput('')
    setIsPrivate(false)
    mutation.reset()
    onClose()
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '')
      if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag])
      setTagInput('')
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const canSubmit = name.trim().length > 0 && category !== null && !mutation.isPending

  const latStr = coords ? `${Math.abs(coords.lat).toFixed(5)}° ${coords.lat >= 0 ? 'N' : 'S'}` : ''
  const lngStr = coords ? `${Math.abs(coords.lng).toFixed(5)}° ${coords.lng >= 0 ? 'E' : 'W'}` : ''

  return (
    <aside className={`add-sheet${isOpen ? ' add-sheet--open' : ''}`}>

      <div className="add-sheet__accent" />

      <div className="add-sheet__header">
        <button className="add-sheet__close" onClick={resetAndClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="#EEEEEE" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="add-sheet__title">Add a Location</span>
      </div>

      <div className="add-sheet__body">

        <div className="add-sheet__coords-block">
          <span className="add-sheet__field-label">Pinned Location</span>
          <p className="add-sheet__coords">{latStr}&nbsp;&nbsp;·&nbsp;&nbsp;{lngStr}</p>
        </div>

        <div className="add-sheet__divider" />

        <div className="add-sheet__section">
          <label className="add-sheet__field-label" htmlFor="location-name">Name</label>
          <input
            id="location-name"
            className="add-sheet__input"
            type="text"
            placeholder="What is this place called?"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={120}
          />
        </div>

        <div className="add-sheet__section">
          <span className="add-sheet__field-label">Category</span>
          <div className="add-sheet__category-grid">
            {(Object.keys(CATEGORY_LABEL) as LocationCategory[]).map(cat => {
              const color = CATEGORY_COLOR[cat]
              const selected = category === cat
              return (
                <button
                  key={cat}
                  className={`add-sheet__category-btn${selected ? ' selected' : ''}`}
                  style={{
                    borderColor: selected ? `${color}88` : 'rgba(111, 207, 151, 0.08)',
                    background:  selected ? `${color}14` : 'rgba(255,255,255,0.02)',
                    color:       selected ? color : '#556a62',
                  }}
                  onClick={() => setCategory(cat)}
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                    {CATEGORY_ICON[cat]}
                  </svg>
                  {CATEGORY_LABEL[cat]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="add-sheet__section">
          <label className="add-sheet__field-label" htmlFor="location-desc">Description</label>
          <textarea
            id="location-desc"
            className="add-sheet__textarea"
            placeholder="What makes this place special? What should someone know before going?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
          />
        </div>

        <div className="add-sheet__section">
          <label className="add-sheet__field-label" htmlFor="location-tags">Tags</label>
          <div className="add-sheet__tags-wrap">
            {tags.map(tag => (
              <span key={tag} className="add-sheet__tag">
                {tag}
                <button
                  className="add-sheet__tag-remove"
                  onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                  type="button"
                >×</button>
              </span>
            ))}
            <input
              id="location-tags"
              className="add-sheet__tag-input"
              type="text"
              placeholder={tags.length === 0 ? 'sunrise, cash only… (Enter to add)' : ''}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
          </div>
        </div>

        <div className="add-sheet__section add-sheet__section--row">
          <div>
            <span className="add-sheet__field-label">Private</span>
            <p className="add-sheet__field-hint">Only visible to you</p>
          </div>
          <button
            className={`add-sheet__toggle${isPrivate ? ' on' : ''}`}
            onClick={() => setIsPrivate(p => !p)}
            type="button"
            role="switch"
            aria-checked={isPrivate}
          >
            <span className="add-sheet__toggle-thumb" />
          </button>
        </div>

        <div className="add-sheet__divider" style={{ marginTop: '1.1rem' }} />

        {mutation.isError && (
          <div className="add-sheet__section">
            <p className="add-sheet__error">Something went wrong. Please try again.</p>
          </div>
        )}

        <div className="add-sheet__section">
          <button
            className="add-sheet__submit"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            type="button"
          >
            {mutation.isPending ? 'Submitting…' : 'Submit location'}
          </button>
        </div>

        <div className="add-sheet__bottom-pad" />
      </div>
    </aside>
  )
}
