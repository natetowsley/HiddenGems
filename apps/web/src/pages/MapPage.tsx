import { useQuery } from '@tanstack/react-query'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { apiGet } from '@/api/client'
import type { LocationCategory, LocationResponse } from '@/types'

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

function GemMarker({ category }: { category: LocationCategory }) {
  const color = CATEGORY_COLOR[category]
  return (
    <svg
      width="20"
      height="26"
      viewBox="0 0 20 26"
      fill="none"
      style={{ cursor: 'pointer', filter: `drop-shadow(0 2px 6px ${color}66)` }}
    >
      <path
        d="M10 0C4.477 0 0 4.477 0 10c0 7.333 10 16 10 16S20 17.333 20 10C20 4.477 15.523 0 10 0z"
        fill={color}
        fillOpacity="0.85"
      />
      <circle cx="10" cy="10" r="3.5" fill="#0e2822" fillOpacity="0.7" />
    </svg>
  )
}

export default function MapPage() {
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
      >
        <NavigationControl position="bottom-right" />

        {locations.map(loc => (
          <Marker
            key={loc.id}
            longitude={loc.lng}
            latitude={loc.lat}
            anchor="bottom"
          >
            <GemMarker category={loc.category} />
          </Marker>
        ))}
      </Map>
    </div>
  )
}
