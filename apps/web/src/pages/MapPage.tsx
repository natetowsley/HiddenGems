import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { apiGet } from '@/api/client'
import type { LocationCategory, LocationResponse } from '@/types'
import LocationSheet from '@/components/LocationSheet'

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

function LocationMarker({ category, name, onClick }: { category: LocationCategory; name: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const color = CATEGORY_COLOR[category]
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
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
          <div style={{ color, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            {category.replace(/_/g, ' ')}
          </div>
        </div>
      )}
      <svg
        width="32"
        height="44"
        viewBox="0 0 32 44"
        fill="none"
        style={{ cursor: 'pointer', filter: `drop-shadow(0 3px 10px ${color}55)`, display: 'block' }}
    >
      <path
        d="M16 2C8.268 2 2 8.268 2 16C2 26 16 43 16 43C16 43 30 26 30 16C30 8.268 23.732 2 16 2Z"
        fill={color}
        fillOpacity="0.12"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="10" fill={color} fillOpacity="0.88" />
      {CATEGORY_ICON[category]}
      </svg>
    </div>
  )
}

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null)

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<LocationResponse[]>('/api/locations'),
  })

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        onClick={() => setSelectedLocation(null)}
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
              onClick={() => setSelectedLocation(loc)}
            />
          </Marker>
        ))}
      </Map>

      <LocationSheet
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />
    </div>
  )
}
