"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Navigation, MapPin, Banknote, CreditCard, ChevronDown, Rocket, Plus } from "lucide-react"
import AutocompleteAddress from "@/components/AutocompleteAddress"
import { geocodeAddress } from "@/lib/geocoding"
import { haversineKm, calcularPrecioEstimado } from "@/lib/pricing"
import { clsx } from "clsx"

const ConfirmTripModal = dynamic(() => import("./ConfirmTripModal"), { ssr: false })

type MetodoPago = "EFECTIVO" | "MERCADO_PAGO"
type Coords = { lat: number; lng: number }

export default function QuickTripForm({ tieneMercadoPago = false }: { tieneMercadoPago?: boolean }) {
  const router = useRouter()
  // Selected (validated) values — only set via onSelect
  const [origenAddress, setOrigenAddress] = useState("")
  const [origenCoords, setOrigenCoords] = useState<Coords | null>(null)
  const [destinoAddress, setDestinoAddress] = useState("")
  const [destinoCoords, setDestinoCoords] = useState<Coords | null>(null)
  // Tracks what the user has typed to control the "unlock" of destino
  const [origenHasText, setOrigenHasText] = useState(false)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO")
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [origenVacio, setOrigenVacio] = useState(false)
  const [destinoVacio, setDestinoVacio] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingCoords, setPendingCoords] = useState<{
    origen: Coords
    destino: Coords | null
  } | null>(null)
  // Estado para el overlay de procesando pago MP
  const [procesandoMP, setProcesandoMP] = useState(false)
  const [errorMP, setErrorMP] = useState<string | null>(null)

  const distanciaKm =
    origenCoords && destinoCoords
      ? Math.round(haversineKm(origenCoords.lat, origenCoords.lng, destinoCoords.lat, destinoCoords.lng) * 10) / 10
      : null
  const precioEstimado =
    origenCoords && destinoCoords
      ? calcularPrecioEstimado(haversineKm(origenCoords.lat, origenCoords.lng, destinoCoords.lat, destinoCoords.lng))
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const sinOrigen = !origenAddress.trim()
    const sinDestino = !destinoAddress.trim()
    setOrigenVacio(sinOrigen)
    setDestinoVacio(sinDestino)
    if (sinOrigen || sinDestino) {
      setError(sinOrigen ? "Seleccioná el origen desde las sugerencias." : "Seleccioná el destino desde las sugerencias.")
      return
    }

    try {
      let coordsOrigen = origenCoords
      if (!coordsOrigen) {
        const g = await geocodeAddress(origenAddress)
        if (!g) {
          setError("No se encontró el origen. Intentá con una dirección más completa.")
          return
        }
        coordsOrigen = g
      }

      let coordsDestino = destinoCoords
      if (!coordsDestino) {
        coordsDestino = await geocodeAddress(destinoAddress)
      }

      setPendingCoords({ origen: coordsOrigen, destino: coordsDestino })
      setShowModal(true)
    } catch {
      setError("Error de conexión. Revisá tu internet e intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmar() {
    if (!pendingCoords) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen_lat: pendingCoords.origen.lat,
          origen_lng: pendingCoords.origen.lng,
          origen_direccion: origenAddress,
          destino_lat: pendingCoords.destino?.lat ?? null,
          destino_lng: pendingCoords.destino?.lng ?? null,
          destino_direccion: destinoAddress || null,
          metodo_pago: metodoPago,
          precio_estimado: precioEstimado,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 409 && data.redirectTo) {
          router.push(data.redirectTo)
          return
        }
        setError(data.error ?? "Error al crear la solicitud.")
        setShowModal(false)
        return
      }

      const data = await res.json()

      // Flujo Mercado Pago: obtener init_point y redirigir al pasajero
      if (metodoPago === "MERCADO_PAGO") {
        setShowModal(false)
        setProcesandoMP(true)
        setErrorMP(null)
        setLoading(false)

        try {
          const initRes = await fetch("/api/pagos/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_solicitud: data.id_solicitud }),
          })
          const initData = await initRes.json()

          if (initRes.ok && initData.init_point) {
            // Redirigir al usuario a Mercado Pago
            window.location.href = initData.init_point
          } else {
            setErrorMP(initData.error ?? "No se pudo iniciar el pago. Intentá de nuevo.")
          }
        } catch {
          setErrorMP("Error de conexión con el servicio de pagos.")
        }
        return
      }

      // Flujo Efectivo: ir directamente a viaje activo
      router.push("/viaje-activo")
    } catch {
      setError("Error de conexión. Revisá tu internet e intentá de nuevo.")
      setShowModal(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showModal && pendingCoords && (
        <ConfirmTripModal
          origenAddress={origenAddress}
          destinoAddress={destinoAddress}
          precioEstimado={precioEstimado}
          distanciaKm={distanciaKm}
          metodoPago={metodoPago}
          loading={loading}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmar}
        />
      )}

      {/* Overlay — Procesando pago con Mercado Pago */}
      {procesandoMP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative holo-border rounded-xl p-8 w-full max-w-sm text-center space-y-5 bg-card scan-lines">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />

            {errorMP ? (
              /* Estado de error */
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-destructive/20 flex items-center justify-center text-3xl text-destructive glow-red">
                  ✕
                </div>
                <div className="space-y-2">
                  <p
                    className="text-sm font-bold text-foreground tracking-widest"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    ERROR AL PAGAR
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{errorMP}</p>
                </div>
                <div className="flex flex-col gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setProcesandoMP(false); setErrorMP(null) }}
                    className="inline-flex w-full h-11 items-center justify-center rounded-xl bg-glow-red text-white text-xs font-semibold glow-red transition hover:brightness-110"
                    style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
                  >
                    INTENTAR DE NUEVO
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProcesandoMP(false); setErrorMP(null) }}
                    className="inline-flex w-full h-10 items-center justify-center rounded-xl border border-zinc-700 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              /* Estado de espera */
              <>
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <p
                    className="text-sm font-bold text-foreground tracking-widest"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    INICIANDO PAGO
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Estamos preparando tu pago con Mercado Pago. Te redirigiremos en un momento.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-primary/60">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Conectando con Mercado Pago…
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="holo-border rounded-xl p-5 space-y-4 relative overflow-hidden scan-lines">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

        <h2
          className="text-xs text-glow-red/90 tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          CENTRO DE MANDO
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
        {/* Origen */}
        <div className="flex items-start gap-2.5">
          <div className="mt-7 w-7 h-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
            <Navigation className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1">
            <AutocompleteAddress
              label="¿Dónde estás?"
              placeholder="Av. Corrientes 1234, Buenos Aires"
              initial=""
              required
              hasError={origenVacio}
              onChange={(val) => {
                setOrigenHasText(val.trim().length > 0)
                if (val.trim() !== origenAddress.trim()) {
                  setOrigenAddress("")
                  setOrigenCoords(null)
                  setOrigenVacio(false)
                }
              }}
              onSelect={(item) => {
                setOrigenAddress(item.direccion)
                setOrigenCoords({ lat: item.lat, lng: item.lng })
                setOrigenHasText(true)
                setOrigenVacio(false)
              }}
            />
          </div>
        </div>

        {/* Connection line */}
        <div className="flex justify-start pl-3.5">
          <div className="w-px h-3 bg-gradient-to-b from-primary/50 to-accent/50" />
        </div>

        {/* Destino — se desbloquea cuando el usuario empieza a escribir en origen */}
        <div className={clsx(
          "flex items-start gap-2.5 transition-opacity duration-300",
          !origenHasText && "opacity-40 pointer-events-none"
        )}>
          <div className={clsx(
            "mt-7 w-7 h-7 shrink-0 rounded-full flex items-center justify-center",
            origenHasText ? "bg-accent/20" : "bg-muted"
          )}>
            <MapPin className={clsx("w-3.5 h-3.5", origenHasText ? "text-accent" : "text-muted-foreground")} />
          </div>
          <div className="flex-1">
            <AutocompleteAddress
              label="¿A dónde vas?"
              placeholder="Palermo Soho, Buenos Aires"
              initial=""
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
            className="w-full flex items-center justify-between px-3 py-2.5 bg-input/30 border border-primary/20 rounded-lg hover:bg-input/50 transition-colors text-sm"
          >
            <div className="flex items-center gap-2">
              {metodoPago === "EFECTIVO" ? (
                <Banknote className="w-4 h-4 text-accent" />
              ) : (
                <CreditCard className="w-4 h-4 text-primary" />
              )}
              <span className="text-foreground">
                {metodoPago === "EFECTIVO" ? "Efectivo" : "Mercado Pago"}
              </span>
            </div>
            <ChevronDown
              className={clsx("w-3.5 h-3.5 text-muted-foreground transition-transform", showPaymentOptions && "rotate-180")}
            />
          </button>
          
          {showPaymentOptions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-primary/20 rounded-lg overflow-hidden z-20 shadow-lg flex flex-col">
              <button
                type="button"
                onClick={() => { setMetodoPago("EFECTIVO"); setShowPaymentOptions(false) }}
                className={clsx("w-full flex items-center gap-2 px-3 py-2.5 hover:bg-primary/10 transition-colors text-sm", metodoPago === "EFECTIVO" && "bg-primary/5")}
              >
                <Banknote className="w-4 h-4 text-accent" />
                <span>Efectivo</span>
              </button>
              
              {tieneMercadoPago ? (
                <button
                  type="button"
                  onClick={() => { setMetodoPago("MERCADO_PAGO"); setShowPaymentOptions(false) }}
                  className={clsx("w-full flex items-center gap-2 px-3 py-2.5 hover:bg-primary/10 transition-colors text-sm", metodoPago === "MERCADO_PAGO" && "bg-primary/5")}
                >
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>Mercado Pago</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/perfil")}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-primary/10 transition-colors text-sm text-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar método de pago</span>
                </button>
              )}
            </div>
          )}
        </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive-foreground"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-glow-red text-white glow-red flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.8rem", letterSpacing: "0.1em" }}
          >
            <Rocket className="w-4 h-4" />
            {loading ? "BUSCANDO CONDUCTOR..." : "SOLICITAR VIAJE"}
          </button>
        </form>
      </div>
    </>
  )
}
