"use client"

import { Navigation, MapPin, Banknote, CreditCard, Car } from "lucide-react"

type MetodoPago = "EFECTIVO" | "MERCADO_PAGO"

interface Props {
  origenAddress: string
  destinoAddress: string
  precioEstimado: number | null
  distanciaKm: number | null
  metodoPago: MetodoPago
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmTripModal({
  origenAddress,
  destinoAddress,
  precioEstimado,
  distanciaKm,
  metodoPago,
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <div className="relative holo-border rounded-xl p-6 w-full max-w-sm space-y-5 bg-card scan-lines">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

        <p className="text-xs text-glow-red/90 tracking-widest text-center" style={{ fontFamily: "var(--font-orbitron)" }}>
          VIAJE DISPONIBLE
        </p>

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-glow-red/10 border border-glow-red/20 flex items-center justify-center">
            <Car className="w-8 h-8 text-glow-red" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 min-w-0">
            <Navigation className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm text-foreground truncate">{origenAddress}</p>
          </div>
          <div className="flex justify-start pl-2">
            <div className="w-px h-3 bg-gradient-to-b from-primary/50 to-accent/50" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-accent shrink-0" />
            <p className="text-sm text-foreground truncate">{destinoAddress}</p>
          </div>
        </div>

        <div className="border-y border-primary/20 py-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
            PRECIO ESTIMADO
          </p>
          <p className="text-3xl font-bold text-accent">
            ${precioEstimado?.toLocaleString("es-AR") ?? "—"} ARS
          </p>
          {distanciaKm !== null && <p className="text-xs text-muted-foreground">aprox. {distanciaKm} km</p>}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {metodoPago === "EFECTIVO" ? (
            <Banknote className="w-4 h-4 text-accent shrink-0" />
          ) : (
            <CreditCard className="w-4 h-4 text-primary shrink-0" />
          )}
          <span>{metodoPago === "EFECTIVO" ? "Pago en efectivo" : "Pago con Mercado Pago"}</span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 h-11 rounded-lg border border-border text-muted-foreground text-sm hover:border-primary/30 hover:text-foreground transition disabled:opacity-40"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 h-11 rounded-lg bg-glow-red text-white glow-red text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.75rem", letterSpacing: "0.05em" }}
          >
            {loading ? "CONFIRMANDO..." : "CONFIRMAR"}
          </button>
        </div>
      </div>
    </div>
  )
}
