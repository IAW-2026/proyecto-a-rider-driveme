"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"

interface Props {
  initialQ?: string
}

export default function HistorialFilters({ initialQ = "" }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(initialQ)

  function apply(nextQ: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextQ) params.set("q", nextQ)
    else params.delete("q")
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    apply(q)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-primary/20 bg-input/50 px-4 py-2.5 focus-within:border-primary/50 transition">
        <svg
          className="h-4 w-4 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          aria-label="Buscar en historial"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por origen o destino…"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); apply("") }}
            aria-label="Limpiar búsqueda"
            className="text-muted-foreground hover:text-foreground transition"
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition hover:border-primary/40 hover:bg-primary/10"
        style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
      >
        Buscar
      </button>
    </form>
  )
}
