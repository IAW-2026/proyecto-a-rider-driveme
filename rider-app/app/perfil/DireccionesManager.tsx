"use client"

import { useState } from "react"
import { MapPin, Plus, Trash2, X, Check } from "lucide-react"
import AutocompleteAddress from "@/components/AutocompleteAddress"

type Direccion = {
  id: string
  nombre: string
  direccion: string | null
  latitud: number
  longitud: number
}

type Props = {
  inicial: Direccion[]
}

export default function DireccionesManager({ inicial }: Props) {
  const [lista, setLista] = useState<Direccion[]>(inicial)
  const [agregando, setAgregando] = useState(false)
  const [draftNombre, setDraftNombre] = useState("")
  const [draftDireccion, setDraftDireccion] = useState("")
  const [draftCoords, setDraftCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [borrando, setBorrando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function cancelarAgregar() {
    setAgregando(false)
    setDraftNombre("")
    setDraftDireccion("")
    setDraftCoords(null)
    setError(null)
  }

  async function handleAgregar() {
    setError(null)
    if (!draftNombre.trim()) { setError("Poné un nombre para la dirección (ej: Casa, Gym)."); return }
    if (!draftDireccion.trim() || !draftCoords) { setError("Seleccioná una dirección del buscador."); return }
    setGuardando(true)
    try {
      const res = await fetch("/api/perfil/direcciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: draftNombre.trim(),
          direccion: draftDireccion.trim(),
          latitud: draftCoords.lat,
          longitud: draftCoords.lng,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al guardar."); return }
      setLista((prev) => [...prev, data])
      cancelarAgregar()
    } catch {
      setError("Error de conexión.")
    } finally {
      setGuardando(false)
    }
  }

  async function handleBorrar(id: string) {
    setBorrando(id)
    try {
      await fetch(`/api/perfil/direcciones/${id}`, { method: "DELETE" })
      setLista((prev) => prev.filter((d) => d.id !== id))
    } catch {
      // silently ignore
    } finally {
      setBorrando(null)
    }
  }

  return (
    <div className="holo-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-bold text-foreground tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          DIRECCIONES FRECUENTES
        </h2>
        {!agregando && lista.length < 10 && (
          <button
            type="button"
            onClick={() => setAgregando(true)}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        )}
      </div>

      {lista.length === 0 && !agregando && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Todavía no tenés direcciones guardadas.
        </p>
      )}

      <ul className="space-y-2" aria-label="Tus direcciones frecuentes">
        {lista.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3"
          >
            <div className="w-8 h-8 shrink-0 rounded-full bg-accent/15 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{d.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{d.direccion ?? "Sin dirección de texto"}</p>
            </div>
            <button
              type="button"
              onClick={() => handleBorrar(d.id)}
              disabled={borrando === d.id}
              aria-label={`Eliminar dirección ${d.nombre}`}
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive-foreground hover:bg-destructive/10 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {agregando && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
          <div>
            <label htmlFor="dir-nombre" className="mb-1.5 block text-xs text-muted-foreground">
              Nombre de la dirección
            </label>
            <input
              id="dir-nombre"
              value={draftNombre}
              onChange={(e) => setDraftNombre(e.target.value)}
              placeholder="Ej: Casa, Trabajo, Gym"
              className="w-full rounded-xl border border-primary/20 bg-input/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          <div>
            <label htmlFor="dir-direccion" className="mb-1.5 block text-xs text-muted-foreground">
              Dirección
            </label>
            <AutocompleteAddress
              id="dir-direccion"
              placeholder="Buscá la dirección..."
              onSelect={(item) => {
                setDraftDireccion(item.direccion)
                setDraftCoords({ lat: item.lat, lng: item.lng })
              }}
              onChange={(val) => {
                if (val !== draftDireccion) setDraftCoords(null)
              }}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAgregar}
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cancelarAgregar}
              className="flex items-center justify-center h-10 px-4 rounded-xl border border-primary/20 text-muted-foreground text-xs hover:bg-primary/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
