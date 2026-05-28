"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ToggleActivoPasajero({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pasajeros/${id}`, { method: "PATCH" })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={activo ? "Desactivar pasajero" : "Activar pasajero"}
      className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition disabled:opacity-50 cursor-pointer ${
        activo
          ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          : "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
      }`}
    >
      {loading ? "…" : activo ? "Desactivar" : "Activar"}
    </button>
  )
}
