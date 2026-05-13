"use client"

import dynamic from "next/dynamic"

const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-xl border border-zinc-800 bg-black/40 text-sm text-zinc-500">
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
