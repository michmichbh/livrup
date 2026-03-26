"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapComponentProps {
  lat: number
  lng: number
  driverName: string
}

export default function MapComponent({ lat, lng, driverName }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Fix icône Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    })

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([lat, lng], 15)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current)

      // Icône personnalisée livreur
      const driverIcon = L.divIcon({
        html: `<div style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🛵</div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      })

      markerRef.current = L.marker([lat, lng], { icon: driverIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>${driverName}</b><br/>En route vers vous !`)
        .openPopup()
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Mettre à jour la position du marker
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current.setView([lat, lng], 15)
    }
  }, [lat, lng])

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", width: "100%", minHeight: "256px" }}
    />
  )
}