import React, { useState, useEffect, useRef } from 'react'
import type { LocationCategory } from '@/types'
import { ALL_CATEGORIES, CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL } from '@/lib/mapConstants'

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY

interface GeocodingFeature {
  place_name: string
  center: [number, number] // [lng, lat]
}

interface MapPanelProps {
  open: boolean
  onClose: () => void
  selectedCategories: Set<LocationCategory>
  minRating: number
  onCategoryToggle: (cat: LocationCategory) => void
  onMinRatingChange: (r: number) => void
  onClear: () => void
  onFlyTo: (lng: number, lat: number, zoom: number) => void
}

export default function MapPanel({
  open,
  onClose,
  selectedCategories,
  minRating,
  onCategoryToggle,
  onMinRatingChange,
  onClear,
  onFlyTo,
}: MapPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(false)
  const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hoverStar, setHoverStar] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim() || selectedPlace) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${MAPTILER_KEY}&limit=5`
        )
        const data = await res.json()
        const features: GeocodingFeature[] = data.features ?? []
        setSuggestions(features)
        setShowSuggestions(features.length > 0)
      } catch { /* ignore */ }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, selectedPlace])

  function handleSuggestionSelect(feature: GeocodingFeature) {
    const [lng, lat] = feature.center
    setSearchQuery(feature.place_name)
    setSelectedPlace(true)
    setSuggestions([])
    setShowSuggestions(false)
    onFlyTo(lng, lat, 11)
  }

  function handleClearSearch() {
    setSearchQuery('')
    setSelectedPlace(false)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  function handleClearAll() {
    onClear()
    setSearchQuery('')
    setSelectedPlace(false)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const hasFilters = selectedCategories.size > 0 || minRating > 0
  const activeStar = hoverStar || minRating

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: 280,
      height: '100vh',
      background: 'rgba(5, 13, 10, 0.97)',
      borderRight: '1px solid rgba(111, 207, 151, 0.1)',
      boxShadow: open ? '8px 0 48px rgba(0,0,0,0.65)' : 'none',
      zIndex: 25,
      transform: open ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.38s cubic-bezier(0.32, 0, 0.15, 1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 16px 14px',
        borderBottom: '1px solid rgba(111, 207, 151, 0.08)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 11,
          fontWeight: 600,
          color: '#4a6660',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Filters
        </span>
        <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          color: '#3a5550',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
          padding: '0 2px',
          transition: 'color 0.15s',
        }}>
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Navigate to area */}
        <section>
          <SectionLabel>Go to area</SectionLabel>
          <div style={{ position: 'relative', marginTop: 8 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                style={{ position: 'absolute', left: 10, color: '#3a5550', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="City, neighborhood…"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  if (selectedPlace) setSelectedPlace(false)
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                style={{
                  width: '100%',
                  padding: '8px 28px 8px 32px',
                  background: 'rgba(14, 30, 24, 0.8)',
                  border: `1px solid ${selectedPlace ? 'rgba(111,207,151,0.32)' : 'rgba(111,207,151,0.1)'}`,
                  borderRadius: 6,
                  color: '#c8ddd8',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
              />
              {searchQuery && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: 'none',
                    border: 'none',
                    color: '#3a5550',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                background: 'rgba(8, 20, 15, 0.98)',
                border: '1px solid rgba(111,207,151,0.14)',
                borderRadius: 6,
                overflow: 'hidden',
                zIndex: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
              }}>
                {suggestions.map((feature, i) => (
                  <button
                    key={i}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSuggestionSelect(feature)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '9px 12px',
                      background: 'none',
                      border: 'none',
                      borderBottom: i < suggestions.length - 1 ? '1px solid rgba(111,207,151,0.06)' : 'none',
                      color: '#8aada5',
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: 11,
                      textAlign: 'left',
                      cursor: 'pointer',
                      lineHeight: 1.4,
                    }}
                  >
                    {feature.place_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <Divider />

        {/* Category */}
        <section>
          <SectionLabel>Category</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {ALL_CATEGORIES.map(cat => {
              const active = selectedCategories.has(cat)
              const color = CATEGORY_COLOR[cat]
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryToggle(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 9px',
                    borderRadius: 20,
                    border: `1px solid ${active ? color + '60' : 'rgba(255,255,255,0.06)'}`,
                    background: active ? color + '18' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: 10,
                    fontWeight: active ? 600 : 400,
                    color: active ? color : '#5a7870',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 32 32" fill="none"
                    style={{ color: active ? color : '#5a7870', flexShrink: 0 }}>
                    {CATEGORY_ICON[cat]}
                  </svg>
                  {CATEGORY_LABEL[cat]}
                </button>
              )
            })}
          </div>
        </section>

        <Divider />

        {/* Min Rating */}
        <section>
          <SectionLabel>Min Rating</SectionLabel>
          <div
            style={{ display: 'flex', gap: 4, marginTop: 10 }}
            onMouseLeave={() => setHoverStar(0)}
          >
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => onMinRatingChange(minRating === star ? 0 : star)}
                onMouseEnter={() => setHoverStar(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  fontSize: 24,
                  lineHeight: 1,
                  color: star <= activeStar ? '#F5A623' : '#1e3530',
                  transition: 'color 0.1s',
                  filter: star <= activeStar ? 'drop-shadow(0 0 5px rgba(245,166,35,0.35))' : 'none',
                }}
              >
                ★
              </button>
            ))}
          </div>
          {minRating > 0 && (
            <div style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 10,
              color: '#F5A623',
              marginTop: 6,
              letterSpacing: '0.04em',
              opacity: 0.8,
            }}>
              {minRating}+ stars
            </div>
          )}
        </section>

        {hasFilters && (
          <>
            <Divider />
            <button
              onClick={handleClearAll}
              style={{
                padding: '9px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                fontSize: 11,
                color: '#3a5550',
                letterSpacing: '0.07em',
                width: '100%',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              Clear all filters
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'Outfit, sans-serif',
      fontSize: 10,
      fontWeight: 600,
      color: '#3a5550',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(111,207,151,0.07)' }} />
}
