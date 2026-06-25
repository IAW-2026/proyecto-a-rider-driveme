"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Phone } from "lucide-react"

export default function RegistroForm() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/pasajeros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, telefono }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Error al guardar los datos.")
        return
      }
      router.push("/inicio")
    } catch {
      setError("Error de conexión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="holo-border rounded-2xl p-6 space-y-5">
      <div>
        <h2
          className="text-sm font-bold text-foreground tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          DATOS PERSONALES
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Completá tu perfil para continuar</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-xs text-muted-foreground">
            Nombre
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-glow-red/60"
            />
          </div>
        </div>

        <div>
          <label htmlFor="apellido" className="mb-1.5 block text-xs text-muted-foreground">
            Apellido
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="apellido"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Tu apellido"
              required
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-glow-red/60"
            />
          </div>
        </div>

        <div>
          <label htmlFor="telefono" className="mb-1.5 block text-xs text-muted-foreground">
            Teléfono
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+54 9 11 1234 5678"
              required
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-glow-red/60"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex min-h-10 items-center justify-center rounded-full border border-red-500/40 bg-gradient-to-r from-red-950 via-red-800 to-orange-950 px-5 text-xs font-semibold tracking-widest text-white shadow-[0_0_24px_rgba(127,29,29,0.45)] transition hover:scale-[1.02] hover:border-red-300/70 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Guardando..." : "CONTINUAR"}
      </button>
    </form>
  )
}
