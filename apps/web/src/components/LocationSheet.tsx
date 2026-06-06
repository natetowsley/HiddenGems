import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/api/client'
import type { LocationCategory, LocationResponse, ReviewResponse } from '@/types'
import './LocationSheet.css'

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

function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div className="ls-stars">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.round(rating)
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1L7.4 4.3H11L8.3 6.3L9.3 9.7L6 7.7L2.7 9.7L3.7 6.3L1 4.3H4.6L6 1Z"
              fill={filled ? '#F5A623' : 'none'}
              stroke={filled ? '#F5A623' : '#1e3b30'}
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="ls-review-card">
      <div className="ls-review-header">
        <span className="ls-review-user">@{review.userId.slice(0, 12)}</span>
        <span className="ls-review-date">{date}</span>
        <div className="ls-review-stars">
          {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ color: i <= review.rating ? '#F5A623' : '#1e3b30', fontSize: 9 }}>★</span>
          ))}
        </div>
      </div>

      {review.text && <p className="ls-review-text">{review.text}</p>}

      <div className="ls-review-footer">
        <button className="ls-vote-btn">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1L9 9H1L5 1Z" fill="currentColor" />
          </svg>
          {review.upvotes}
        </button>
        <button className="ls-vote-btn">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 9L1 1H9L5 9Z" fill="currentColor" />
          </svg>
          {review.downvotes}
        </button>
      </div>
    </div>
  )
}

interface Props {
  location: LocationResponse | null
  onClose: () => void
}

export default function LocationSheet({ location, onClose }: Props) {
  // Keep last non-null location displayed during slide-out animation
  const [displayed, setDisplayed] = useState<LocationResponse | null>(location)

  useEffect(() => {
    if (location) setDisplayed(location)
  }, [location])

  const isOpen = location !== null
  const loc = displayed
  const color = loc ? CATEGORY_COLOR[loc.category] : '#6FCF97'

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', loc?.id],
    queryFn: () => apiGet<ReviewResponse[]>(`/api/locations/${loc!.id}/reviews`),
    enabled: !!loc,
  })

  const latStr = loc
    ? `${Math.abs(loc.lat).toFixed(4)}° ${loc.lat >= 0 ? 'N' : 'S'}`
    : ''
  const lngStr = loc
    ? `${Math.abs(loc.lng).toFixed(4)}° ${loc.lng >= 0 ? 'E' : 'W'}`
    : ''

  return (
    <aside className={`location-sheet${isOpen ? ' location-sheet--open' : ''}`}>

      <div className="ls-accent-bar" style={{ background: color }} />

      <div className="ls-header">
        <button className="ls-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="#EEEEEE" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="ls-header-actions">
          <button className="ls-action-btn save" onClick={() => console.log('save', loc?.id)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 1.5h8v9L6 8.5 2 10.5V1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Save
          </button>
          <button className="ls-action-btn report" onClick={() => console.log('report', loc?.id)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2h7L7.5 5.5 9 9H2V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <line x1="2" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Report
          </button>
        </div>
      </div>

      {loc && (
        <div className="ls-body">

          <div className="ls-identity">
            <div className="ls-meta">
              <span
                className="ls-category-badge"
                style={{ color, borderColor: `${color}40` }}
              >
                {CATEGORY_LABEL[loc.category]}
              </span>
              {loc.status === 'pending' ? (
                <span className="ls-pending-tooltip-wrap">
                  <span className="ls-status-badge pending">pending</span>
                  <span className="ls-pending-tooltip">
                    Only you can see this location. It won't be visible to others until it is verified.
                  </span>
                </span>
              ) : (
                <span className={`ls-status-badge ${loc.status}`}>{loc.status}</span>
              )}
              {loc.isPrivate && <span className="ls-private-badge">Private</span>}
            </div>

            <h2 className="ls-name">{loc.name}</h2>

            <div className="ls-rating-row">
              <Stars rating={loc.avgRating} />
              <span className="ls-rating-num">{loc.avgRating.toFixed(1)}</span>
            </div>

            <p className="ls-coords">{latStr}&nbsp;&nbsp;·&nbsp;&nbsp;{lngStr}</p>
          </div>

          <div className="ls-divider" />

          {loc.description && (
            <div className="ls-description-section">
              <p className="ls-description">{loc.description}</p>
            </div>
          )}

          {loc.tags.length > 0 && (
            <div className="ls-tags">
              {loc.tags.map(tag => (
                <span key={tag} className="ls-tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="ls-divider" />

          <div className="ls-reviews-section">
            <div className="ls-section-header">
              <span className="ls-section-label">Reviews</span>
              <span className="ls-section-count">{reviews.length}</span>
            </div>

            {reviews.length === 0 ? (
              <p className="ls-empty">No reviews yet. Be the first to leave one.</p>
            ) : (
              <div className="ls-reviews-list">
                {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </div>

          <div className="ls-bottom-pad" />
        </div>
      )}
    </aside>
  )
}
