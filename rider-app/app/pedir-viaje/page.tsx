"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { geocodeAddress } from "@/lib/geocoding"

type MetodoPago = "EFECTIVO" | "TARJETA"

export default function PedirViajePage() {
  const router = useRouter()
  const [origen, setOrigen] = useState("")
  const [destino, setDestino] = useState("")
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO")
  const [precioEstimado, setPrecioEstimado] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const coordsOrigen = await geocodeAddress(origen)
      if (!coordsOrigen) {
        setError("No se encontró el origen. Intentá con una dirección más completa.")
        return
      }

      const coordsDestino = destino ? await geocodeAddress(destino) : null

      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen_lat: coordsOrigen.lat,
          origen_lng: coordsOrigen.lng,
          destino_lat: coordsDestino?.lat ?? null,
          destino_lng: coordsDestino?.lng ?? null,
          metodo_pago: metodoPago,
          precio_estimado: precioEstimado ? Math.round(parseFloat(precioEstimado) * 100) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al crear la solicitud.")
        return
      }

      router.push("/viaje-activo")
    } catch {
      setError("Error de conexión. Revisá tu internet e intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,0,0,0.22),transparent),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(120,0,255,0.12),transparent)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-red-400/70">Pedido de viaje</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Pedir viaje</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Completá los datos y buscamos un conductor para vos.
            </p>
          </div>
          <Link
            href="/inicio"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-red-400/60 hover:bg-red-500/10"
          >
            Volver al inicio
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] sm:p-8">
            <h2 className="text-xl font-semibold">Tu viaje</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Escribí la dirección completa para que podamos ubicarte correctamente.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="origen" className="mb-2 block text-sm font-medium text-zinc-200">
                  Origen <span className="text-red-400">*</span>
                </label>
                <input
                  id="origen"
                  type="text"
                  required
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                  className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label htmlFor="destino" className="mb-2 block text-sm font-medium text-zinc-200">
                  Destino
                </label>
                <input
                  id="destino"
                  type="text"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Ej: Palermo Soho, Buenos Aires"
                  className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="metodo-pago" className="mb-2 block text-sm font-medium text-zinc-200">
                    Método de pago
                  </label>
                  <select
                    id="metodo-pago"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                    className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="precio" className="mb-2 block text-sm font-medium text-zinc-200">
                    Precio estimado ($)
                  </label>
                  <input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioEstimado}
                    onChange={(e) => setPrecioEstimado(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-red-700 via-red-600 to-orange-600 px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgba(220,38,38,0.25)] transition hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Buscando conductor..." : "Solicitar viaje"}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">¿Cómo funciona?</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p>1. Escribís tu origen y destino.</p>
                <p>2. Lo convertimos a coordenadas automáticamente.</p>
                <p>3. Publicamos tu solicitud para que un conductor la acepte.</p>
                <p>4. Te mostramos el estado en tiempo real.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-red-950/40 to-black/60 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-red-300/70">Cancelación</p>
              <p className="mt-3 text-sm text-zinc-300">
                Podés cancelar mientras no haya un conductor aceptado.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
