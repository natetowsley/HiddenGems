import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/api/client'
import './ReviewFormModal.css'

const RATING_LABEL = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

interface Props {
  locationId: string
  isOpen: boolean
  onClose: () => void
}

export default function ReviewFormModal({ locationId, isOpen, onClose }: Props) {
  const qc = useQueryClient()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [text, setText] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      apiPost(`/api/locations/${locationId}/reviews`, {
        rating,
        text: text.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', locationId] })
      handleClose()
    },
  })

  function handleClose() {
    setRating(0)
    setHovered(0)
    setText('')
    mutation.reset()
    onClose()
  }

  if (!isOpen) return null

  const display = hovered || rating

  return (
    <div className="rfm-backdrop" onClick={handleClose}>
      <div className="rfm-modal" onClick={e => e.stopPropagation()}>

        <div className="rfm-header">
          <span className="rfm-title">Write a Review</span>
          <button className="rfm-close" onClick={handleClose} aria-label="Close">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="#EEEEEE" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="rfm-body">

          <div className="rfm-section">
            <span className="rfm-label">Rating</span>
            <div className="rfm-stars">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  className="rfm-star-btn"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  type="button"
                  aria-label={`${i} star${i !== 1 ? 's' : ''}`}
                >
                  <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M14 3L17 10.5H25L18.5 15.5L21 23L14 18.5L7 23L9.5 15.5L3 10.5H11L14 3Z"
                      fill={i <= display ? '#F5A623' : 'none'}
                      stroke={i <= display ? '#F5A623' : '#1e3b30'}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
            <span className={`rfm-rating-label${display > 0 ? ' rfm-rating-label--visible' : ''}`}>
              {RATING_LABEL[display]}
            </span>
          </div>

          <div className="rfm-section">
            <label className="rfm-label" htmlFor="rfm-text">
              Review <span className="rfm-optional">(optional)</span>
            </label>
            <textarea
              id="rfm-text"
              className="rfm-textarea"
              placeholder="What did you think? What should others know?"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              maxLength={1000}
            />
          </div>

          {mutation.isError && (
            <p className="rfm-error">Something went wrong. Please try again.</p>
          )}

          <div className="rfm-actions">
            <button className="rfm-btn-ghost" onClick={handleClose} type="button">
              Cancel
            </button>
            <button
              className="rfm-btn-primary"
              onClick={() => mutation.mutate()}
              disabled={rating === 0 || mutation.isPending}
              type="button"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
