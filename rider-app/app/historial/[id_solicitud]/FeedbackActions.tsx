"use client"

import { useState } from "react"

type Props = {
  viajeId: string | null
  conductorId: string | null
  puedeDejarFeedback: boolean
}

export default function FeedbackActions({ viajeId, conductorId, puedeDejarFeedback }: Props) {
  const [puntaje, setPuntaje] = useState("5")
  const [comentario, setComentario] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviar() {
    if (!viajeId || !conductorId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_viaje: viajeId,
          id_receptor: conductorId,
          puntaje: Number(puntaje),
          comentario,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar el feedback")
      setEnviado(true)
      setComentario("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el feedback")
    } finally {
      setLoading(false)
    }
  }

  if (!puedeDejarFeedback) {
    return (
      <div className="holo-border rounded-xl p-5">
        <p
          className="text-xs text-muted-foreground tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          FEEDBACK
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          El feedback solo está disponible en viajes finalizados correctamente.
        </p>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/10 p-5">
        <p
          className="text-xs text-accent/70 tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          FEEDBACK
        </p>
        <p className="mt-3 text-sm text-accent">Tu feedback fue enviado. ¡Gracias!</p>
      </div>
    )
  }

  return (
    <div className="holo-border rounded-xl p-5 space-y-4 relative overflow-hidden scan-lines">
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-glow-cyan/40 rounded-tl-xl" />

      <div>
        <p
          className="text-xs text-glow-cyan/70 tracking-widest"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          FEEDBACK
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">Calificá tu viaje</h2>
        <p className="text-sm text-muted-foreground">Se envía a la app de feedback compartida.</p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm text-foreground/80">Puntaje</span>
        <select
          value={puntaje}
          onChange={(e) => setPuntaje(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-primary/20 bg-input/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {[5, 4, 3, 2, 1].map((v) => (
            <option key={v} value={v}>{v} estrellas</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-foreground/80">Comentario</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          disabled={loading}
          rows={4}
          placeholder="Contá cómo fue el viaje"
          className="w-full rounded-xl border border-primary/20 bg-input/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </label>

      <button
        type="button"
        onClick={enviar}
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-accent text-accent-foreground px-5 text-sm font-semibold glow-accent transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
      >
        {loading ? "Enviando…" : "ENVIAR FEEDBACK"}
      </button>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground"
        >
          {error}
        </p>
      )}
    </div>
  )
}
