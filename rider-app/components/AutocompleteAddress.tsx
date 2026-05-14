"use client"
import { useEffect, useState, useRef } from "react"

export default function AutocompleteAddress({
  label,
  placeholder,
  onSelect,
  onChange,
  initial = "",
  required = false,
  hasError = false,
}: {
  label?: string
  placeholder?: string
  initial?: string
  required?: boolean
  hasError?: boolean
  onChange?: (value: string) => void
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
        <label className="mb-2 block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); onChange?.(e.target.value) }}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-input/50 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all ${
          hasError ? "border-destructive/60" : "border-primary/20"
        }`}
        onFocus={() => { if (suggestions.length) setOpen(true) }}
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-primary/20 bg-popover p-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              onMouseDown={() => handleSelect(s)}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors"
            >
              {s.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
