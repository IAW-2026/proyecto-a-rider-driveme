"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteViajeButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Borrar este viaje y sus transacciones? Esta acción no se puede deshacer.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/viajes/${id}`, { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex h-7 items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
    >
      {loading ? "…" : "Borrar"}
    </button>
  )
}
