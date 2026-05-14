"use client"

import { useState } from "react"
import { Search } from "lucide-react"

type Props = {
  placeholder?: string
  onSearch?: (q: string) => void
}

export default function SearchBar({ placeholder = "Próximo salto intergaláctico", onSearch }: Props) {
  const [q, setQ] = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQ(v)
    onSearch?.(v)
  }

  return (
    <div className="w-full">
      <label className="sr-only">Buscar galaxias</label>
      <div className="relative flex w-full items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            value={q}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full pl-10 h-12 rounded-xl bg-input/50 border border-primary/20 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => onSearch?.(q)}
          className="h-12 px-5 rounded-xl bg-glow-red text-white text-sm font-semibold glow-red hover:brightness-110 transition-all"
          style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
        >
          Saltar
        </button>
      </div>
    </div>
  )
}
