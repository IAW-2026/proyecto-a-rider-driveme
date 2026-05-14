"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Home, Briefcase, MapPin, Pencil, X, Check } from "lucide-react"
import AutocompleteAddress from "@/components/AutocompleteAddress"

type PlaceId = "casa" | "trabajo" | "otro"

type SavedPlace = {
  customLabel?: string
  direccion: string
  lat: number
  lng: number
}

type SavedPlaces = Record<PlaceId, SavedPlace | null>

const STORAGE_KEY = "driveme_saved_places"

const SLOT_META: Record<PlaceId, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  casa: { label: "Casa", icon: Home },
  trabajo: { label: "Trabajo", icon: Briefcase },
  otro: { label: "Otro", icon: MapPin },
}

const DEFAULT_PLACES: SavedPlaces = { casa: null, trabajo: null, otro: null }

function loadFromStorage(): SavedPlaces {
  if (typeof window === "undefined") return DEFAULT_PLACES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_PLACES, ...JSON.parse(raw) } : DEFAULT_PLACES
  } catch {
    return DEFAULT_PLACES
  }
}

export default function SavedPlaces() {
  const router = useRouter()
  const [places, setPlaces] = useState<SavedPlaces>(DEFAULT_PLACES)
  const [editing, setEditing] = useState<PlaceId | null>(null)
  const [draftAddress, setDraftAddress] = useState("")
  const [draftCoords, setDraftCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [draftLabel, setDraftLabel] = useState("")

  useEffect(() => {
    setPlaces(loadFromStorage())
  }, [])

  function startEdit(id: PlaceId) {
    const existing = places[id]
    setDraftAddress(existing?.direccion ?? "")
    setDraftCoords(existing ? { lat: existing.lat, lng: existing.lng } : null)
    setDraftLabel(existing?.customLabel ?? "")
    setEditing(id)
  }

  function cancelEdit() {
    setEditing(null)
    setDraftAddress("")
    setDraftCoords(null)
    setDraftLabel("")
  }

  function saveEdit(id: PlaceId) {
    if (!draftAddress.trim() || !draftCoords) return
    const updated: SavedPlaces = {
      ...places,
      [id]: {
        direccion: draftAddress,
        lat: draftCoords.lat,
        lng: draftCoords.lng,
        ...(id === "otro" && draftLabel.trim() ? { customLabel: draftLabel.trim() } : {}),
      },
    }
    setPlaces(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    cancelEdit()
  }

  function removePlace(id: PlaceId) {
    const updated: SavedPlaces = { ...places, [id]: null }
    setPlaces(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    cancelEdit()
  }

  function handleTap(saved: SavedPlace) {
    router.push(
      `/pedir-viaje?destino=${encodeURIComponent(saved.direccion)}&destino_lat=${saved.lat}&destino_lng=${saved.lng}`
    )
  }

  return (
    <div className="w-full space-y-3">
      <p
        className="text-xs text-primary/70 tracking-widest"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        DESTINOS FRECUENTES
      </p>

      <div className="space-y-2">
        {(Object.keys(SLOT_META) as PlaceId[]).map((id) => {
          const meta = SLOT_META[id]
          const Icon = meta.icon
          const saved = places[id]
          const displayLabel = id === "otro" && saved?.customLabel ? saved.customLabel : meta.label

          if (editing === id) {
            return (
              <div key={id} className="holo-border rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary/60" />
                    <span
                      className="text-xs text-primary/60 tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      {meta.label.toUpperCase()}
                    </span>
                  </div>
                  <button type="button" onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {id === "otro" && (
                  <input
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    placeholder="Nombre personalizado (ej: Gym)"
                    className="w-full rounded-lg border border-primary/20 bg-input/50 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                )}

                <AutocompleteAddress
                  placeholder="Ingresá la dirección"
                  initial={draftAddress}
                  onChange={(val) => {
                    if (val.trim() !== draftAddress.trim()) {
                      setDraftCoords(null)
                    }
                  }}
                  onSelect={(item) => {
                    setDraftAddress(item.direccion)
                    setDraftCoords({ lat: item.lat, lng: item.lng })
                  }}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(id)}
                    disabled={!draftAddress.trim() || !draftCoords}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                  {saved && (
                    <button
                      type="button"
                      onClick={() => removePlace(id)}
                      className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-destructive/30 text-destructive-foreground text-xs hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )
          }

          if (saved) {
            return (
              <div key={id} className="holo-border rounded-xl overflow-hidden group flex items-center">
                <button
                  type="button"
                  onClick={() => handleTap(saved)}
                  className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left min-w-0"
                >
                  <div className="w-9 h-9 shrink-0 rounded-full bg-accent/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium text-foreground"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      {displayLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{saved.direccion}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(id)}
                  className="shrink-0 p-2 mr-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }

          return (
            <button
              key={id}
              type="button"
              onClick={() => startEdit(id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="w-9 h-9 shrink-0 rounded-full bg-muted/40 flex items-center justify-center">
                <Icon className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <div className="text-left">
                <p
                  className="text-xs text-muted-foreground/60"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  {meta.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/40">+ Configurar dirección</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
