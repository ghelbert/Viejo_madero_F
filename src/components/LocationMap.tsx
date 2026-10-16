import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './LocationMap.css'

type LocationMapProps = {
  latitude: number | null
  longitude: number | null
  interactive?: boolean
  onChange?: (latitude: number, longitude: number) => void
  label: string
}

function validCoordinates(latitude: number | null, longitude: number | null) {
  return latitude !== null
    && longitude !== null
    && Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
}

export function LocationMap({
  latitude,
  longitude,
  interactive = false,
  onChange,
  label,
}: LocationMapProps) {
  const container = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const initialCoordinates = useRef({ latitude, longitude })

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const element = container.current
    if (!element) return

    const { latitude: initialLatitude, longitude: initialLongitude } = initialCoordinates.current
    const hasCoordinates = validCoordinates(initialLatitude, initialLongitude)
    const center: L.LatLngExpression = hasCoordinates
      ? [initialLatitude ?? -12.0464, initialLongitude ?? -77.0428]
      : [-12.0464, -77.0428]
    const map = L.map(element, { scrollWheelZoom: false }).setView(center, hasCoordinates ? 15 : 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const createMarker = (position: L.LatLng, draggable: boolean) => {
      const marker = L.marker(position, { draggable }).addTo(map)
      if (draggable) {
        marker.on('dragend', () => {
          const next = marker.getLatLng()
          onChangeRef.current?.(next.lat, next.lng)
        })
      }
      markerRef.current = marker
      return marker
    }

    if (hasCoordinates) {
      createMarker(L.latLng(center), interactive)
    }
    if (interactive) {
      map.on('click', (event: L.LeafletMouseEvent) => {
        const marker = markerRef.current ?? createMarker(event.latlng, true)
        marker.setLatLng(event.latlng)
        onChangeRef.current?.(event.latlng.lat, event.latlng.lng)
      })
    }

    mapRef.current = map
    return () => {
      markerRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [interactive])

  useEffect(() => {
    if (!mapRef.current) return
    if (latitude === null || longitude === null || !validCoordinates(latitude, longitude)) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }
    const position = L.latLng(latitude, longitude)
    if (markerRef.current) markerRef.current.setLatLng(position)
    else {
      const marker = L.marker(position, { draggable: interactive }).addTo(mapRef.current)
      if (interactive) {
        marker.on('dragend', () => {
          const next = marker.getLatLng()
          onChangeRef.current?.(next.lat, next.lng)
        })
      }
      markerRef.current = marker
    }
    mapRef.current.setView(position, mapRef.current.getZoom())
  }, [interactive, latitude, longitude])

  return <div className="locationMap" ref={container} role="region" aria-label={label} />
}
