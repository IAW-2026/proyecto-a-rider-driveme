"use client"

import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import Link from "next/link"

type Direccion = {
  id: string
  nombre: string
  direccion: string | null
  latitud: number
  longitud: number
}

export default function SavedPlaces({ lugares }: { lugares: Direccion[] }) {
  const router = useRouter()

  if (lugares.length === 0) {
    return (
      <div className="w-full space-y-3">
        <p
          className="text-xs text-primary/70 tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          DESTINOS FRECUENTES
        </p>
        <div className="rounded-xl border border-dashed border-primary/20 px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground/60">No hay coordenadas registradas.</p>
          <Link
            href="/perfil"
            className="mt-1 inline-block text-xs text-primary/60 underline underline-offset-2 hover:text-primary transition"
          >
            Registrá desde tu expediente
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <p
          className="text-xs text-primary/70 tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          DESTINOS FRECUENTES
        </p>
        <Link
          href="/perfil"
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition"
        >
          Gestionar
        </Link>
      </div>

      <div className="space-y-2">
        {lugares.map((lugar) => (
          <button
            key={lugar.id}
            type="button"
            onClick={() =>
              router.push(`/inicio?destinoDir=${encodeURIComponent(lugar.direccion || lugar.nombre)}&destinoLat=${lugar.latitud}&destinoLng=${lugar.longitud}`)
            }
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl holo-border hover:bg-primary/5 transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 shrink-0 rounded-full bg-accent/15 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium text-foreground"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                {lugar.nombre}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{lugar.direccion}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
