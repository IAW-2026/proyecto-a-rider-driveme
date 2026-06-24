"use client"

import { useState } from "react"
import { Wallet, Plus, Check } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PaymentMethods({ initialTieneMP }: { initialTieneMP: boolean }) {
  const [hasMercadoPago, setHasMercadoPago] = useState(initialTieneMP)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggleMP = async (valor: boolean) => {
    setLoading(true)
    try {
      const res = await fetch("/api/perfil/pagos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tieneMercadoPago: valor })
      })
      if (res.ok) {
        setHasMercadoPago(valor)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="holo-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="w-5 h-5 text-primary" />
        <h2
          className="text-sm font-bold text-foreground tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          MÉTODOS DE PAGO
        </h2>
      </div>
      
      <div className="space-y-3">
        {/* Efectivo - siempre disponible */}
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-500 font-bold">$</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Efectivo</p>
              <p className="text-xs text-muted-foreground">Pago al finalizar el viaje</p>
            </div>
          </div>
          <span className="text-xs text-primary font-medium tracking-widest uppercase bg-primary/10 px-2 py-1 rounded-md">
            Principal
          </span>
        </div>

        {/* Mercado Pago */}
        {hasMercadoPago ? (
          <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Mercado Pago</p>
                <p className="text-xs text-muted-foreground">Vinculado exitosamente</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleMP(false)}
              disabled={loading}
              className="text-xs text-red-400 hover:text-red-300 transition underline underline-offset-2 disabled:opacity-50"
            >
              Desvincular
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleToggleMP(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 px-4 py-4 text-sm text-muted-foreground transition hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Cargando...</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Vincular cuenta de Mercado Pago
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
