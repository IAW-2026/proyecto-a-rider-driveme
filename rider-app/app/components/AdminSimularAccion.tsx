"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  solicitudId: string
  estado: string
  viajeEstado: string | null
}

export default function AdminSimularAccion({ solicitudId, estado, viajeEstado }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const showAceptar = estado === "BUSCANDO_CONDUCTOR"
  const showFinalizar = estado === "ACEPTADA" && viajeEstado === "EN_CURSO"
  const showCancelar = estado === "ACEPTADA" && viajeEstado === "EN_CURSO"

  if (!showAceptar && !showFinalizar && !showCancelar) return null

  async function simular(tipo: "simular-aceptacion" | "simular-finalizacion" | "simular-cancelacion") {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/solicitudes/${solicitudId}/${tipo}`, {
        method: "POST",
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (showAceptar) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={() => simular("simular-aceptacion")}
        className="inline-flex h-7 items-center rounded-full bg-blue-600/20 px-3 text-xs font-medium text-blue-300 transition hover:bg-blue-600/40 disabled:opacity-50"
      >
        {loading ? "…" : "Simular aceptación"}
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => simular("simular-finalizacion")}
        className="inline-flex h-7 items-center rounded-full bg-green-600/20 px-3 text-xs font-medium text-green-300 transition hover:bg-green-600/40 disabled:opacity-50"
      >
        {loading ? "…" : "Finalizar"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => simular("simular-cancelacion")}
        className="inline-flex h-7 items-center rounded-full bg-red-600/20 px-3 text-xs font-medium text-red-300 transition hover:bg-red-600/40 disabled:opacity-50"
      >
        {loading ? "…" : "Cancelar conductor"}
      </button>
    </div>
  )
}
