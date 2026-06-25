"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"

export default function CancelarPagoCard({ solicitudId }: { solicitudId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cancelarPago() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "PAGO_RECHAZADO" }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? "No se pudo cancelar el pago.")
        setLoading(false)
      }
    } catch {
      setError("Error de conexión.")
      setLoading(false)
    }
  }

  return (
    <div className="holo-border rounded-xl p-8 text-center space-y-4 relative overflow-hidden scan-lines">
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />

      <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
        <CreditCard className="w-7 h-7 text-primary" />
      </div>

      <h2
        className="text-xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        PAGO NO CONFIRMADO
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Hubo un problema con el pago de Mercado Pago. Podés cancelar esta solicitud y pedir un nuevo viaje.
      </p>

      {error && (
        <p className="text-xs text-destructive-foreground bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={cancelarPago}
        disabled={loading}
        className="inline-flex w-full h-12 items-center justify-center rounded-full bg-glow-red text-white text-sm font-semibold glow-red transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
      >
        {loading ? "CANCELANDO…" : "CANCELAR Y PEDIR NUEVO VIAJE"}
      </button>
    </div>
  )
}
