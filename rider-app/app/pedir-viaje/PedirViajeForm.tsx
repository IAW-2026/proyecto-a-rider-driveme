"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navigation, MapPin, Banknote, CreditCard, ChevronDown } from "lucide-react"
import { geocodeAddress } from "@/lib/geocoding"
import AutocompleteAddress from "@/components/AutocompleteAddress"
import { cn } from "@/lib/utils"

type MetodoPago = "EFECTIVO" | "TARJETA"

export default function PedirViajeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialDestino = searchParams.get("destino") ?? ""
  const initialDestinoLat = searchParams.get("destino_lat")
  const initialDestinoLng = searchParams.get("destino_lng")

  const [origenAddress, setOrigenAddress] = useState("")
  const [origenCoords, setOrigenCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destinoAddress, setDestinoAddress] = useState(initialDestino)
  const [destinoCoords, setDestinoCoords] = useState<{ lat: number; lng: number } | null>(
    initialDestinoLat && initialDestinoLng
      ? { lat: parseFloat(initialDestinoLat), lng: parseFloat(initialDestinoLng) }
      : null
  )
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO")
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [origenVacio, setOrigenVacio] = useState(false)
  const [destinoVacio, setDestinoVacio] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const sinOrigen = !origenAddress.trim()
    const sinDestino = !destinoAddress.trim()
    setOrigenVacio(sinOrigen)
    setDestinoVacio(sinDestino)
    if (sinOrigen || sinDestino) {
      setError("Completá el origen y el destino.")
      return
    }
    setLoading(true)

    try {
      let coordsOrigen = origenCoords
      if (!coordsOrigen) {
        const g = await geocodeAddress(origenAddress)
        if (!g) {
          setError("No se encontró el origen. Intentá con una dirección más completa.")
          setLoading(false)
          return
        }
        coordsOrigen = g
      }

      let coordsDestino = destinoCoords
      if (!coordsDestino && destinoAddress) {
        coordsDestino = await geocodeAddress(destinoAddress)
      }

      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen_lat: coordsOrigen.lat,
          origen_lng: coordsOrigen.lng,
          origen_direccion: origenAddress,
          destino_lat: coordsDestino?.lat ?? null,
          destino_lng: coordsDestino?.lng ?? null,
          destino_direccion: destinoAddress || null,
          metodo_pago: metodoPago,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 409 && data.redirectTo) {
          router.push(data.redirectTo)
          return
        }
        setError(data.error ?? "Error al crear la solicitud.")
        setLoading(false)
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
    <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Form card */}
        <div className="holo-border rounded-xl p-6 space-y-5 relative overflow-hidden scan-lines">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

          <div>
            <h2
              className="text-sm text-glow-red/90 tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              COORDENADAS DE VIAJE
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Escribí la dirección completa para que podamos ubicarte.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Origen */}
            <div className="flex items-start gap-3">
              <div className="mt-7 w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <AutocompleteAddress
                  label="Origen"
                  placeholder="Av. Corrientes 1234, Buenos Aires"
                  initial={origenAddress}
                  required
                  hasError={origenVacio}
                  onChange={(val) => {
                    if (val.trim() !== origenAddress.trim()) {
                      setOrigenAddress("")
                      setOrigenCoords(null)
                    }
                  }}
                  onSelect={(item) => {
                    setOrigenAddress(item.direccion)
                    setOrigenCoords({ lat: item.lat, lng: item.lng })
                    setOrigenVacio(false)
                  }}
                />
              </div>
            </div>

            {/* Connection line */}
            <div className="flex justify-start pl-4">
              <div className="w-px h-4 bg-gradient-to-b from-primary/50 to-accent/50" />
            </div>

            {/* Destino */}
            <div className="flex items-start gap-3">
              <div className={cn(
                "mt-7 w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-300",
                origenAddress ? "bg-accent/20" : "bg-muted"
              )}>
                <MapPin className={cn(
                  "w-4 h-4 transition-colors",
                  origenAddress ? "text-accent" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1">
                <AutocompleteAddress
                  label="Destino"
                  placeholder="Palermo Soho, Buenos Aires"
                  initial={destinoAddress}
                  required
                  hasError={destinoVacio}
                  onChange={(val) => {
                    if (val.trim() !== destinoAddress.trim()) {
                      setDestinoAddress("")
                      setDestinoCoords(null)
                      setDestinoVacio(false)
                    }
                  }}
                  onSelect={(item) => {
                    setDestinoAddress(item.direccion)
                    setDestinoCoords({ lat: item.lat, lng: item.lng })
                    setDestinoVacio(false)
                  }}
                />
              </div>
            </div>

            {/* Método de pago */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                className="w-full flex items-center justify-between px-4 py-3 bg-input/30 border border-primary/20 rounded-lg hover:bg-input/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {metodoPago === "EFECTIVO" ? (
                    <Banknote className="w-5 h-5 text-accent" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-sm text-foreground">
                    {metodoPago === "EFECTIVO" ? "Efectivo" : "Mercado Pago"}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    showPaymentOptions && "rotate-180"
                  )}
                />
              </button>

              {showPaymentOptions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-primary/20 rounded-lg overflow-hidden z-20 shadow-lg">
                  <button
                    type="button"
                    onClick={() => { setMetodoPago("EFECTIVO"); setShowPaymentOptions(false) }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors",
                      metodoPago === "EFECTIVO" && "bg-primary/5"
                    )}
                  >
                    <Banknote className="w-5 h-5 text-accent" />
                    <span className="text-sm">Efectivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMetodoPago("TARJETA"); setShowPaymentOptions(false) }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors",
                      metodoPago === "TARJETA" && "bg-primary/5"
                    )}
                  >
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-sm">Mercado Pago</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-lg bg-glow-red text-white glow-red flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.875rem", letterSpacing: "0.1em" }}
            >
              {loading ? "BUSCANDO CONDUCTOR..." : "SOLICITAR VIAJE"}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="holo-border rounded-xl p-5 space-y-3 relative overflow-hidden scan-lines">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-xl" />

            <p
              className="text-xs text-primary/80 tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              ¿CÓMO FUNCIONA?
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Escribís tu origen y destino.</p>
              <p>2. Lo convertimos a coordenadas automáticamente.</p>
              <p>3. Publicamos tu solicitud para que un conductor la acepte.</p>
              <p>4. Te mostramos el estado en tiempo real.</p>
            </div>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-2">
            <p
              className="text-xs text-destructive/70 tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              CANCELACIÓN
            </p>
            <p className="text-sm text-muted-foreground">
              Podés cancelar mientras no haya un conductor aceptado.
            </p>
          </div>

          <Link
            href="/inicio"
            className="inline-flex w-full h-11 items-center justify-center rounded-xl border border-border text-muted-foreground text-sm transition hover:border-primary/30 hover:text-foreground"
          >
            Volver al inicio
          </Link>
        </aside>
      </div>
    </main>
  )
}
