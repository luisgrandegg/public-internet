'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Listing } from '@/lib/types'
import styles from './ListingsMap.module.css'

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface ListingsMapProps {
  listings: Listing[]
  hoveredListingId: string | null
}

function computeCentre(listings: Listing[]): [number, number] {
  if (listings.length === 0) return [48.0, 10.0]
  const avgLat = listings.reduce((sum, l) => sum + l.location.coordinates.lat, 0) / listings.length
  const avgLng = listings.reduce((sum, l) => sum + l.location.coordinates.lng, 0) / listings.length
  return [avgLat, avgLng]
}

export default function ListingsMap({ listings, hoveredListingId }: ListingsMapProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({})
  const centre = computeCentre(listings)

  useEffect(() => {
    if (hoveredListingId && markerRefs.current[hoveredListingId]) {
      markerRefs.current[hoveredListingId].openPopup()
    }
  }, [hoveredListingId])

  return (
    <div className={styles.root} role="region" aria-label="Map of listings">
      <MapContainer
        center={centre}
        zoom={5}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.location.coordinates.lat, listing.location.coordinates.lng]}
            ref={(marker) => {
              if (marker) {
                markerRefs.current[listing.id] = marker
              } else {
                delete markerRefs.current[listing.id]
              }
            }}
          >
            <Popup>
              <strong>{listing.title}</strong>
              <br />
              €{listing.nightlyRate}/night — total price
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
