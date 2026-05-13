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
      <div className="rounded-3xl border border-zinc-800 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Feedback</p>
        <p className="mt-3 text-sm text-zinc-500">
          El feedback solo está disponible en viajes finalizados correctamente.
        </p>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-green-300/70">Feedback</p>
        <p className="mt-3 text-sm text-green-200">Tu feedback fue enviado. ¡Gracias!</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Feedback</p>
      <h2 className="mt-3 text-xl font-semibold text-white">Calificá tu viaje</h2>
      <p className="mt-2 text-sm text-zinc-400">Se envía a la app de feedback compartida.</p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-zinc-300">Puntaje</span>
          <select
            value={puntaje}
            onChange={(e) => setPuntaje(e.target.value)}
            disabled={loading}
            className="w-full rounded-2xl border border-zinc-700 bg-black/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {[5, 4, 3, 2, 1].map((v) => (
              <option key={v} value={v}>{v} estrellas</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-zinc-300">Comentario</span>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            disabled={loading}
            rows={4}
            placeholder="Contá cómo fue el viaje"
            className="w-full rounded-2xl border border-zinc-700 bg-black/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <button
          type="button"
          onClick={enviar}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviar feedback"}
        </button>

        {error && (
          <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
