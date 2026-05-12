"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "BUSCANDO_CONDUCTOR", label: "Buscando conductor" },
  { value: "ACEPTADA", label: "Aceptada" },
  { value: "CANCELADA_POR_PASAJERO", label: "Cancelada por pasajero" },
  { value: "EXPIRADA_SIN_ACEPTACION", label: "Expirada" },
]

interface Props {
  showEstado?: boolean
  initialQ?: string
  initialEstado?: string
}

export default function AdminFilters({ showEstado, initialQ = "", initialEstado = "" }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(initialQ)
  const [estado, setEstado] = useState(initialEstado)

  function apply(nextQ: string, nextEstado: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextQ) params.set("q", nextQ)
    else params.delete("q")
    if (nextEstado) params.set("estado", nextEstado)
    else params.delete("estado")
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    apply(q, estado)
  }

  function handleEstadoChange(value: string) {
    setEstado(value)
    apply(q, value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
      <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-2xl border border-zinc-700 bg-black/40 px-4 py-2.5 focus-within:border-red-400/60 focus-within:ring-2 focus-within:ring-red-500/20">
        <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          aria-label="Buscar"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        />
      </div>

      {showEstado && (
        <select
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(e) => handleEstadoChange(e.target.value)}
          className="rounded-2xl border border-zinc-700 bg-black/40 px-4 py-2.5 text-sm text-white outline-none transition focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
      )}

      <button
        type="submit"
        className="rounded-2xl border border-zinc-700 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:border-red-400/60 hover:bg-red-500/10"
      >
        Buscar
      </button>
    </form>
  )
}
