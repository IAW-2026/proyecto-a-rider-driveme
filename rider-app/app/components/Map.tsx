"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet's default icon paths broken by webpack
const iconDefault = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface Props {
  origen: { lat: number; lng: number }
  destino?: { lat: number; lng: number } | null
}

export default function Map({ origen, destino }: Props) {
  useEffect(() => {
    L.Marker.prototype.options.icon = iconDefault
  }, [])

  return (
    <MapContainer
      center={[origen.lat, origen.lng]}
      zoom={14}
      style={{ height: "300px", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[origen.lat, origen.lng]} icon={iconDefault}>
        <Popup>Origen</Popup>
      </Marker>
      {destino && (
        <Marker position={[destino.lat, destino.lng]} icon={iconDefault}>
          <Popup>Destino</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
