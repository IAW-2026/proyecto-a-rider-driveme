"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EliminarPasajero({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function eliminar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pasajeros/${id}`, { method: "DELETE" })
      if (res.ok) router.push("/admin/pasajeros")
    } finally {
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-7 items-center rounded-full border border-red-700/40 bg-red-950/40 px-3 text-xs font-medium text-red-400 transition hover:bg-red-950/70 cursor-pointer"
      >
        Eliminar
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-red-400">¿Confirmar?</span>
      <button
        type="button"
        onClick={eliminar}
        disabled={loading}
        className="inline-flex h-7 items-center rounded-full border border-red-500/50 bg-red-500/20 px-3 text-xs font-medium text-red-300 transition hover:bg-red-500/30 disabled:opacity-50 cursor-pointer"
      >
        {loading ? "…" : "Sí, eliminar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="inline-flex h-7 items-center rounded-full border border-zinc-700 bg-white/5 px-3 text-xs text-zinc-400 transition hover:border-zinc-500 cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  )
}
