"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

// Turbopack returns PNG imports from node_modules as plain URL strings;
// webpack/image-optimization returns StaticImageData ({ src: string }).
const asUrl = (m: string | { src: string }): string =>
  typeof m === "string" ? m : m.src

const iconDefault = L.icon({
  iconUrl: asUrl(markerIcon as string | { src: string }),
  iconRetinaUrl: asUrl(markerIcon2x as string | { src: string }),
  shadowUrl: asUrl(markerShadow as string | { src: string }),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = iconDefault

interface Props {
  origen: { lat: number; lng: number }
  destino?: { lat: number; lng: number } | null
}

export default function Map({ origen, destino }: Props) {
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
