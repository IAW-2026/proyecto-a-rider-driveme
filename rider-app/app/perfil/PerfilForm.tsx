"use client"

import { useState } from "react"
import { User, Phone, Save, Pencil, X } from "lucide-react"

type Props = {
  nombre: string
  telefono: string | null
}

export default function PerfilForm({ nombre, telefono }: Props) {
  const [editing, setEditing] = useState(false)
  const [draftNombre, setDraftNombre] = useState(nombre)
  const [draftTelefono, setDraftTelefono] = useState(telefono ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState({ nombre, telefono: telefono ?? "" })

  async function handleSave() {
    setError(null)
    if (draftNombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: draftNombre.trim(), telefono: draftTelefono.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Error al guardar.")
        return
      }
      const data = await res.json()
      setCurrent({ nombre: data.nombre, telefono: data.telefono ?? "" })
      setDraftNombre(data.nombre)
      setDraftTelefono(data.telefono ?? "")
      setEditing(false)
    } catch {
      setError("Error de conexión.")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraftNombre(current.nombre)
    setDraftTelefono(current.telefono)
    setError(null)
    setEditing(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-bold text-foreground tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          DATOS PERSONALES
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="nombre" className="mb-1.5 block text-xs text-muted-foreground">
              Nombre
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                id="nombre"
                value={draftNombre}
                onChange={(e) => setDraftNombre(e.target.value)}
                className="w-full rounded-xl border border-primary/20 bg-input/50 pl-9 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefono" className="mb-1.5 block text-xs text-muted-foreground">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                id="telefono"
                value={draftTelefono}
                onChange={(e) => setDraftTelefono(e.target.value)}
                className="w-full rounded-xl border border-primary/20 bg-input/50 pl-9 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-glow-red text-white text-xs font-semibold glow-red hover:brightness-110 transition-all disabled:opacity-50"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-primary/20 text-muted-foreground text-xs hover:bg-primary/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <span className="text-foreground">{current.nombre}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <span className="text-muted-foreground">{current.telefono || "No configurado"}</span>
          </div>
        </div>
      )}
    </div>
  )
}
