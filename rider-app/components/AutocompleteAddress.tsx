"use client"
import { useEffect, useState, useRef } from "react"

export default function AutocompleteAddress({
  label,
  placeholder,
  onSelect,
  initial = "",
  required = false,
  hasError = false,
}: {
  label?: string
  placeholder?: string
  initial?: string
  required?: boolean
  hasError?: boolean
  onSelect: (item: { direccion: string; lat: number; lng: number }) => void
}) {
  const [q, setQ] = useState(initial)
  const [suggestions, setSuggestions] = useState<Array<{ displayName: string; lat: number; lng: number }>>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    if (!q || q.trim().length < 2) {
      setSuggestions([])
      return
    }
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocoding/suggestions?q=${encodeURIComponent(q)}`)
        if (!res.ok) return
        const data = await res.json()
        setSuggestions(data)
        setOpen(true)
      } catch {
        setSuggestions([])
      }
    }, 300)

    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [q])

  function handleSelect(item: { displayName: string; lat: number; lng: number }) {
    setQ(item.displayName)
    setOpen(false)
    onSelect({ direccion: item.displayName, lat: item.lat, lng: item.lng })
  }

  return (
    <div className="relative">
      {label && (
        <label className="mb-2 block text-sm font-medium text-zinc-200">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-red-400/60 ${hasError ? "border-red-500/60" : "border-zinc-700"}`}
        onFocus={() => { if (suggestions.length) setOpen(true) }}
      />
      {open && suggestions.length > 0 && (
        <ul role="listbox" className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-black/80 p-1">
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              onMouseDown={() => handleSelect(s)}
              className="cursor-pointer rounded px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
            >
              {s.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
