import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { apiGet } from '@/api/client'
import type { LocationCategory, LocationResponse, LocationStatus } from '@/types'
import LocationSheet from '@/components/LocationSheet'
import AddLocationSheet from '@/components/AddLocationSheet'

const MAP_STYLE = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`

const INITIAL_VIEW = { longitude: -98.5795, latitude: 39.8283, zoom: 4 }

const CATEGORY_COLOR: Record<LocationCategory, string> = {
  study_spot: '#7EB8F7',
  food:       '#F5A623',
  scenic:     '#6FCF97',
  hangout:    '#B88EF0',
  trail:      '#C4956A',
  activity:   '#F06B6B',
  other:      '#8899AA',
}

const CATEGORY_ICON: Record<LocationCategory, React.ReactNode> = {
  scenic: (
    <path d="M16 10L23 21H9L16 10Z" fill="white" fillOpacity="0.92" />
  ),
  food: (
    <g stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none">
      <line x1="16" y1="11" x2="16" y2="22" />
      <line x1="13" y1="11" x2="13" y2="15" />
      <line x1="19" y1="11" x2="19" y2="15" />
      <path d="M13 15Q16 16.5 19 15" />
    </g>
  ),
  study_spot: (
    <g stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M16 11C14 10 11 10.5 10 12L10 22C11 20.5 14 20 16 21" />
      <path d="M16 11C18 10 21 10.5 22 12L22 22C21 20.5 18 20 16 21" />
      <line x1="16" y1="11" x2="16" y2="21" />
    </g>
  ),
  hangout: (
    <g fill="white" fillOpacity="0.92">
      <circle cx="16" cy="12" r="3" />
      <path d="M10 22C10 18.5 12.7 16 16 16S22 18.5 22 22Z" />
    </g>
  ),
  trail: (
    <g fill="white" fillOpacity="0.92">
      <ellipse cx="13" cy="13" rx="2.2" ry="3.2" transform="rotate(-20 13 13)" />
      <ellipse cx="20" cy="20" rx="2.2" ry="3.2" transform="rotate(20 20 20)" />
    </g>
  ),
  activity: (
    <path d="M18 10H13.5L11 17H15L12.5 23L22 14H17.5L18 10Z" fill="white" fillOpacity="0.92" />
  ),
  other: (
    <path d="M16 10L17.5 15L22 16L17.5 17L16 22L14.5 17L10 16L14.5 15Z" fill="white" fillOpacity="0.92" />
  ),
}

function LocationMarker({ category, name, status, onClick }: {
  category: LocationCategory
  name: string
  status: LocationStatus
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const color = CATEGORY_COLOR[category]
  const pending = status === 'pending'

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', opacity: pending ? 0.6 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={e => { e.stopPropagation(); onClick() }}
    >
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 6,
          background: 'rgba(14, 40, 34, 0.92)',
          border: `1px solid ${color}33`,
          borderRadius: 6,
          padding: '5px 10px',
          whiteSpace: 'nowrap',
          fontFamily: 'Outfit, sans-serif',
          pointerEvents: 'none',
        }}>
          <div style={{ color: '#EEEEEE', fontSize: 12, fontWeight: 600 }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ color, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {category.replace(/_/g, ' ')}
            </span>
            {pending && (
              <span style={{ color: '#F5A623', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                · pending
              </span>
            )}
          </div>
        </div>
      )}
      <svg
        width="32"
        height="44"
        viewBox="0 0 32 44"
        fill="none"
        style={{ cursor: 'pointer', filter: `drop-shadow(0 3px 10px ${color}${pending ? '33' : '55'})`, display: 'block' }}
      >
        <path
          d="M16 2C8.268 2 2 8.268 2 16C2 26 16 43 16 43C16 43 30 26 30 16C30 8.268 23.732 2 16 2Z"
          fill={color}
          fillOpacity="0.12"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={pending ? '3 2' : undefined}
        />
        <circle cx="16" cy="16" r="10" fill={color} fillOpacity={pending ? 0.5 : 0.88} />
        {CATEGORY_ICON[category]}
      </svg>
    </div>
  )
}

type HoverCoords = { lat: number; lng: number; x: number; y: number }

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null)
  const [placingPin, setPlacingPin]             = useState(false)
  const [hoverCoords, setHoverCoords]           = useState<HoverCoords | null>(null)
  const [pendingCoords, setPendingCoords]       = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && placingPin) {
        setPlacingPin(false)
        setHoverCoords(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [placingPin])

  const { data: allLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<LocationResponse[]>('/api/locations'),
  })

  const { data: mine = [] } = useQuery({
    queryKey: ['locations', 'mine'],
    queryFn: () => apiGet<LocationResponse[]>('/api/locations/mine'),
  })

  const locations = [...allLocations, ...mine.filter(l => l.status === 'pending')]

  function handleMapClick(e: { lngLat: { lat: number; lng: number } }) {
    if (placingPin) {
      setPendingCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      setSelectedLocation(null)
      setPlacingPin(false)
      setHoverCoords(null)
    } else {
      setSelectedLocation(null)
    }
  }

  function handleMouseMove(e: { lngLat: { lat: number; lng: number }; point: { x: number; y: number } }) {
    if (placingPin) {
      setHoverCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng, x: e.point.x, y: e.point.y })
    }
  }

  const latLabel = hoverCoords
    ? `${Math.abs(hoverCoords.lat).toFixed(5)}° ${hoverCoords.lat >= 0 ? 'N' : 'S'}`
    : ''
  const lngLabel = hoverCoords
    ? `${Math.abs(hoverCoords.lng).toFixed(5)}° ${hoverCoords.lng >= 0 ? 'E' : 'W'}`
    : ''

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        cursor={placingPin ? 'crosshair' : 'grab'}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCoords(null)}
      >
        <NavigationControl position="bottom-right" />

        {locations.map(loc => (
          <Marker
            key={loc.id}
            longitude={loc.lng}
            latitude={loc.lat}
            anchor="bottom"
          >
            <LocationMarker
              category={loc.category}
              name={loc.name}
              status={loc.status}
              onClick={() => !placingPin && setSelectedLocation(loc)}
            />
          </Marker>
        ))}
      </Map>

      {/* Placement mode hint bar */}
      {placingPin && (
        <div style={{
          position: 'fixed',
          top: '1.1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(6, 15, 11, 0.88)',
          border: '1px solid rgba(111, 207, 151, 0.18)',
          borderRadius: '6px',
          padding: '7px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          pointerEvents: 'none',
          zIndex: 30,
          backdropFilter: 'blur(6px)',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="#6FCF97" strokeWidth="1" />
            <line x1="5" y1="1" x2="5" y2="3" stroke="#6FCF97" strokeWidth="1" strokeLinecap="round" />
            <line x1="5" y1="7" x2="5" y2="9" stroke="#6FCF97" strokeWidth="1" strokeLinecap="round" />
            <line x1="1" y1="5" x2="3" y2="5" stroke="#6FCF97" strokeWidth="1" strokeLinecap="round" />
            <line x1="7" y1="5" x2="9" y2="5" stroke="#6FCF97" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, color: '#9aada5', letterSpacing: '0.08em' }}>
            Click to place your pin
          </span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, color: '#2d5248', letterSpacing: '0.06em' }}>
            ESC to cancel
          </span>
        </div>
      )}

      {/* Coordinate tooltip following cursor */}
      {placingPin && hoverCoords && (
        <div style={{
          position: 'fixed',
          left: hoverCoords.x + 18,
          top: hoverCoords.y - 38,
          background: 'rgba(6, 15, 11, 0.92)',
          border: '1px solid rgba(111, 207, 151, 0.14)',
          borderRadius: '5px',
          padding: '5px 10px',
          pointerEvents: 'none',
          zIndex: 30,
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            fontFamily: 'Outfit, monospace',
            fontSize: 11,
            color: '#6FCF97',
            letterSpacing: '0.1em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {latLabel}
          </span>
          <span style={{ fontFamily: 'Outfit, monospace', fontSize: 11, color: '#2d5248', margin: '0 6px' }}>·</span>
          <span style={{
            fontFamily: 'Outfit, monospace',
            fontSize: 11,
            color: '#6FCF97',
            letterSpacing: '0.1em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {lngLabel}
          </span>
        </div>
      )}

      {/* Add pin button */}
      <button
        onClick={() => { setPlacingPin(p => !p); setHoverCoords(null) }}
        title={placingPin ? 'Cancel placement' : 'Add a spot'}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: placingPin ? 'rgba(111, 207, 151, 0.12)' : 'rgba(6, 15, 11, 0.9)',
          border: `1px solid ${placingPin ? 'rgba(111, 207, 151, 0.5)' : 'rgba(111, 207, 151, 0.22)'}`,
          color: '#6FCF97',
          fontSize: placingPin ? 20 : 24,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          transition: 'background 0.2s, border-color 0.2s',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          fontFamily: 'Outfit, sans-serif',
          lineHeight: 1,
        }}
      >
        {placingPin ? '×' : '+'}
      </button>

      <LocationSheet
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />

      <AddLocationSheet
        coords={pendingCoords}
        onClose={() => setPendingCoords(null)}
      />
    </div>
  )
}
