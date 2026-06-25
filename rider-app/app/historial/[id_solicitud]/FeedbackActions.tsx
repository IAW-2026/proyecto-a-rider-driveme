"use client"

import { useState } from "react"
import { useLocalStorageValue } from "@/lib/useLocalStorage"

type Props = {
  viajeId: string | null
  conductorId: string | null
  idCalificacion: string | null
  puntajeGuardado?: number | null
  comentarioGuardado?: string | null
  sinEstrellas?: boolean
}

const MOTIVOS = [
  { value: "SOLICITUD_EDICION", label: "Quiero corregir mi calificación" },
  { value: "COMENTARIO_INAPROPIADO", label: "Comentario inapropiado" },
  { value: "OTRO", label: "Otro reclamo" },
]

function renderEstrellas(n: number) {
  const clamped = Math.max(1, Math.min(5, Math.round(n)))
  return "★".repeat(clamped) + "☆".repeat(5 - clamped)
}

export default function FeedbackActions({ viajeId, conductorId, idCalificacion: idCalificacionProp, puntajeGuardado = null, comentarioGuardado = null, sinEstrellas = false }: Props) {
  const [puntaje, setPuntaje] = useState("5")
  const [comentario, setComentario] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [puntajeEnviado, setPuntajeEnviado] = useState<number | null>(null)
  const [comentarioEnviado, setComentarioEnviado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const feedbackGuardado = useLocalStorageValue(viajeId ? `feedback_viaje_${viajeId}` : null)
  const feedbackYaDado = feedbackGuardado === "1"

  const puntajeLocalStorage = useLocalStorageValue(viajeId ? `feedback_puntaje_${viajeId}` : null)
  const comentarioLocalStorage = useLocalStorageValue(viajeId ? `feedback_comentario_${viajeId}` : null)

  const idCalificacionGuardado = useLocalStorageValue(viajeId ? `feedback_calificacion_${viajeId}` : null)
  const [idCalificacionLocal, setIdCalificacionLocal] = useState<string | null>(null)
  const idCalificacion = idCalificacionLocal ?? idCalificacionGuardado ?? idCalificacionProp

  const puntajeMostrado = puntajeEnviado ?? (puntajeLocalStorage ? Number(puntajeLocalStorage) : null) ?? puntajeGuardado
  const comentarioMostrado = comentarioEnviado ?? comentarioLocalStorage ?? comentarioGuardado

  const [showReporte, setShowReporte] = useState(false)
  const [reporteMotivo, setReporteMotivo] = useState(MOTIVOS[0].value)
  const [reporteDescripcion, setReporteDescripcion] = useState("")
  const [reporteLoading, setReporteLoading] = useState(false)
  const [reporteEnviado, setReporteEnviado] = useState(false)
  const [reporteError, setReporteError] = useState<string | null>(null)

  async function enviar() {
    if (!viajeId || !conductorId) return
    setLoading(true)
    setError(null)
    try {
      const puntajeEfectivo = sinEstrellas ? 1 : Number(puntaje)
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_viaje: viajeId,
          id_receptor: conductorId,
          puntaje: puntajeEfectivo,
          comentario,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar el feedback")
      if (viajeId) {
        localStorage.setItem(`feedback_viaje_${viajeId}`, "1")
        localStorage.setItem(`feedback_puntaje_${viajeId}`, String(puntajeEfectivo))
        localStorage.setItem(`feedback_comentario_${viajeId}`, comentario)
        if (data.id_calificacion) {
          localStorage.setItem(`feedback_calificacion_${viajeId}`, data.id_calificacion)
          setIdCalificacionLocal(data.id_calificacion)
        }
      }
      setPuntajeEnviado(puntajeEfectivo)
      setComentarioEnviado(comentario)
      setEnviado(true)
      setComentario("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el feedback")
    } finally {
      setLoading(false)
    }
  }

  async function enviarReporte() {
    if (!idCalificacion) return
    setReporteLoading(true)
    setReporteError(null)
    try {
      const res = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_calificacion: idCalificacion,
          motivo: reporteMotivo,
          descripcion: reporteDescripcion,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar el reclamo")
      setReporteEnviado(true)
    } catch (err) {
      setReporteError(err instanceof Error ? err.message : "Error de conexión")
    } finally {
      setReporteLoading(false)
    }
  }

  const panelContacto = !idCalificacion ? null : (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
      <p
        className="text-xs text-primary/60 tracking-widest"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        ¿MÁS FEEDBACK?
      </p>

      {reporteEnviado ? (
        <div className="flex items-center gap-2">
          <span className="text-accent">✓</span>
          <p className="text-sm text-accent">Reclamo enviado. Lo revisaremos pronto.</p>
        </div>
      ) : !showReporte ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            ¿Querés corregir tu reseña o hacer un reclamo?
          </p>
          <button
            type="button"
            onClick={() => setShowReporte(true)}
            className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition"
          >
            Enviar un reclamo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Motivo</span>
            <select
              value={reporteMotivo}
              onChange={(e) => setReporteMotivo(e.target.value)}
              disabled={reporteLoading}
              className="w-full rounded-lg border border-primary/20 bg-input/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
            >
              {MOTIVOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Descripción</span>
            <textarea
              rows={3}
              value={reporteDescripcion}
              onChange={(e) => setReporteDescripcion(e.target.value)}
              disabled={reporteLoading}
              placeholder="Explicá qué querés modificar o reportar"
              className="w-full rounded-lg border border-primary/20 bg-input/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary resize-none disabled:opacity-50"
            />
          </label>

          {reporteError && (
            <p className="text-xs text-destructive-foreground bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {reporteError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowReporte(false)}
              disabled={reporteLoading}
              className="flex-1 h-9 rounded-lg border border-border text-muted-foreground text-sm hover:border-primary/30 hover:text-foreground transition disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={enviarReporte}
              disabled={reporteLoading || !reporteDescripcion.trim()}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reporteLoading ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (!viajeId || !conductorId) return null

  if (feedbackYaDado || enviado || puntajeGuardado != null) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 space-y-3">
          <p
            className="text-xs text-accent/70 tracking-widest"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            FEEDBACK
          </p>
          {sinEstrellas ? (
            <p className="text-sm text-accent font-medium">Ya dejaste tu comentario.</p>
          ) : (
            <div className="space-y-2">
              {puntajeMostrado != null && (
                <p className="text-xl tracking-wider text-accent" aria-label={`${puntajeMostrado} estrellas`}>
                  {renderEstrellas(puntajeMostrado)}
                </p>
              )}
              <p className="text-sm text-accent font-medium">Ya calificaste este viaje.</p>
            </div>
          )}
          {comentarioMostrado && (
            <p className="text-sm text-foreground/70 italic leading-relaxed border-t border-accent/20 pt-3">
              &ldquo;{comentarioMostrado}&rdquo;
            </p>
          )}
        </div>
        {panelContacto}
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
          {sinEstrellas ? "DEJÁ UN COMENTARIO" : "FEEDBACK"}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">
          {sinEstrellas ? "¿Querés contarnos qué pasó?" : "Calificá tu viaje"}
        </h2>
        {!sinEstrellas && (
          <p className="text-sm text-muted-foreground">Se envía a la app de feedback compartida.</p>
        )}
      </div>

      {!sinEstrellas && (
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
      )}

      <label className="block">
        <span className="mb-2 block text-sm text-foreground/80">Comentario</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          disabled={loading}
          rows={4}
          placeholder={sinEstrellas ? "Contanos qué pasó con la cancelación" : "Contá cómo fue el viaje"}
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
        {loading ? "Enviando…" : "ENVIAR"}
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
