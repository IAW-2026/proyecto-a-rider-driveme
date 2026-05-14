"use client"

import dynamic from "next/dynamic"

const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-card/50 text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  ),
})

export default function MapDetalle({
  origen,
  destino,
}: {
  origen: { lat: number; lng: number }
  destino: { lat: number; lng: number } | null
}) {
  return <Map origen={origen} destino={destino} />
}
