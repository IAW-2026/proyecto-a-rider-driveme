"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteViajeButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/viajes/${id}`, { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="inline-flex h-7 items-center rounded-full border border-red-500/50 bg-red-500/20 px-3 text-xs font-medium text-red-300 transition hover:bg-red-500/30 disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          {loading ? "…" : "Sí, borrar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="inline-flex h-7 items-center rounded-full border border-zinc-700 px-3 text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50 cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex h-7 items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-400 transition hover:bg-red-500/20 cursor-pointer"
    >
      Borrar
    </button>
  )
}
