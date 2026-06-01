"use client"

import { useState, useEffect, useRef, useSyncExternalStore } from "react"
import { useLocalStorageValue } from "@/lib/useLocalStorage"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { AppHeader } from "../components/AppHeader"

const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-card/50 text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  ),
})

interface Props {
  solicitudId: string
  estado: string
  origen: { lat: number; lng: number }
  origenDireccion: string | null
  destino: { lat: number; lng: number } | null
  destinoDireccion: string | null
  viajeEstado: string | null
  viajeId: string | null
  idConductor: string | null
  creadaEn: string
  nombrePasajero: string
}

type Driver = {
  nombre: string
  patente: string
  calificacionPromedio: number | null
  etaLlegadaMinutos: number
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

const ESTADO_LABEL: Record<string, string> = {
  BUSCANDO_CONDUCTOR: "Buscando conductor…",
  ACEPTADA: "Conductor asignado",
  ACEPTADO: "Conductor confirmado",
  EN_CURSO: "Viaje en curso",
  FINALIZADO: "Viaje finalizado",
  CANCELADO_POR_CONDUCTOR: "Cancelado por el conductor",
}

const MOTIVOS_CANCELACION = [
  "Me equivoqué de destino",
  "Tardó demasiado",
  "Ya no lo necesito",
  "Otro",
]

export default function ViajeActivoCliente({
  solicitudId,
  estado,
  origen,
  origenDireccion,
  destino,
  destinoDireccion,
  viajeEstado,
  viajeId,
  idConductor,
  creadaEn,
  nombrePasajero,
}: Props) {
  const router = useRouter()
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loadingDriver, setLoadingDriver] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // feedback post-FINALIZADO
  const [puntaje, setPuntaje] = useState(0)
  const [comentario, setComentario] = useState("")
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackEnviado, setFeedbackEnviado] = useState(false)
  const feedbackGuardado = useLocalStorageValue(viajeId ? `feedback_viaje_${viajeId}` : null)
  const feedbackYaDado = feedbackGuardado === "1"

  // mounted guard para evitar flash de hidratación en el modal
  const mounted = useIsClient()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMapReady(true), 600)
    return () => window.clearTimeout(timeoutId)
  }, [])

  // feedback post-CANCELADO_POR_CONDUCTOR
  const [comentarioCancelacion, setComentarioCancelacion] = useState("")
  const [cancelFeedbackLoading, setCancelFeedbackLoading] = useState(false)

  // feedback post-EXPIRADA
  const [comentarioExpiracion, setComentarioExpiracion] = useState("")

  // auto-aceptación a los 15 segundos
  const [autoAceptar, setAutoAceptar] = useState(true)
  const autoAceptarFired = useRef(false)

  // modal motivos post-cancelación del pasajero
  const [showCancelMotivo, setShowCancelMotivo] = useState(false)

  async function handleEnviarFeedback() {
    setFeedbackLoading(true)
    setFeedbackError(null)
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_viaje: viajeId, id_receptor: idConductor, puntaje, comentario }),
      })
      const data = await res.json()
      if (res.ok) {
        if (viajeId) {
          localStorage.setItem(`feedback_viaje_${viajeId}`, "1")
          if (data.id_calificacion) localStorage.setItem(`feedback_calificacion_${viajeId}`, data.id_calificacion)
        }
        setFeedbackEnviado(true)
        router.push("/inicio")
      } else {
        setFeedbackError(data.error ?? "Error al enviar el feedback.")
      }
    } catch {
      setFeedbackError("Error de conexión.")
    } finally {
      setFeedbackLoading(false)
    }
  }

  async function handleCancelFeedback() {
    if (!viajeId || !idConductor) { router.push("/inicio"); return }
    setCancelFeedbackLoading(true)
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_viaje: viajeId, id_receptor: idConductor, puntaje: 1, comentario: comentarioCancelacion }),
      })
      const data = await res.json()
      if (res.ok && viajeId) {
        localStorage.setItem(`feedback_viaje_${viajeId}`, "1")
        if (data.id_calificacion) localStorage.setItem(`feedback_calificacion_${viajeId}`, data.id_calificacion)
      }
    } catch {}
    router.push("/inicio")
  }

  const esBuscando = estado === "BUSCANDO_CONDUCTOR"
  const estadoMostrado =
    viajeEstado
      ? (ESTADO_LABEL[viajeEstado] ?? viajeEstado)
      : (ESTADO_LABEL[estado] ?? estado)

  const EXPIRY_SECONDS = 120
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!esBuscando) return
    const start = new Date(creadaEn).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [esBuscando, creadaEn])

  const isExpired = esBuscando && elapsed >= EXPIRY_SECONDS

  useEffect(() => {
    if (!isExpired) return
    fetch(`/api/solicitudes/${solicitudId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "EXPIRADA_SIN_ACEPTACION" }),
    }).catch(() => {})
  }, [isExpired, solicitudId])

  useEffect(() => {
    if (!esBuscando || !autoAceptar || elapsed < 15 || autoAceptarFired.current) return
    autoAceptarFired.current = true
    fetch(`/api/solicitudes/${solicitudId}/simular-aceptacion`, { method: "POST" })
      .then(res => { if (res.ok) router.refresh() })
      .catch(() => {})
  }, [esBuscando, autoAceptar, elapsed, solicitudId, router])

  useEffect(() => {
    let mounted = true
    async function loadDriver() {
      if (!idConductor) return
      setLoadingDriver(true)
      try {
        const res = await fetch(`/api/conductores/${idConductor}`)
        if (!res.ok) return
        const d = await res.json()
        if (mounted) setDriver(d)
      } catch {}
      setLoadingDriver(false)
    }
    loadDriver()
    return () => { mounted = false }
  }, [idConductor])

  async function cancelar() {
    setCancelando(true)
    setError(null)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CANCELADA_POR_PASAJERO" }),
      })
      if (res.ok) {
        setAutoAceptar(false)
        autoAceptarFired.current = true
        setShowCancelMotivo(true)
      } else {
        const data = await res.json()
        setError(data.error ?? "No se pudo cancelar la solicitud.")
        setCancelando(false)
      }
    } catch {
      setError("Error de conexión.")
      setCancelando(false)
    }
  }

  // ─── CANCELADO POR CONDUCTOR ──────────────────────────────────────────────
  if (viajeEstado === "CANCELADO_POR_CONDUCTOR") {
    return (
      <div className="min-h-screen bg-background stars-bg relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-md holo-border rounded-xl p-8 space-y-5 relative overflow-hidden scan-lines">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center text-2xl text-destructive glow-red">
                  ✕
                </div>
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                  EL CONDUCTOR CANCELÓ
                </h1>
                <p className="text-sm text-muted-foreground">
                  ¿Querés contarnos qué pasó? Tu comentario nos ayuda a mejorar.
                </p>
              </div>

              <textarea
                rows={4}
                value={comentarioCancelacion}
                onChange={(e) => setComentarioCancelacion(e.target.value)}
                disabled={cancelFeedbackLoading}
                placeholder="Contanos lo que pasó (opcional)"
                className="w-full rounded-xl border border-primary/20 bg-input/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary disabled:opacity-50 resize-none"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/inicio")}
                  disabled={cancelFeedbackLoading}
                  className="flex-1 h-11 rounded-xl border border-border text-muted-foreground text-sm hover:border-primary/30 hover:text-foreground transition disabled:opacity-40"
                >
                  Omitir
                </button>
                <button
                  type="button"
                  onClick={handleCancelFeedback}
                  disabled={cancelFeedbackLoading}
                  className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.75rem", letterSpacing: "0.05em" }}
                >
                  {cancelFeedbackLoading ? "ENVIANDO…" : "ENVIAR"}
                </button>
              </div>

              <Link
                href="/pedir-viaje"
                className="inline-flex w-full h-11 items-center justify-center rounded-xl bg-glow-red text-white text-xs font-semibold glow-red transition hover:brightness-110"
                style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
              >
                PEDIR NUEVO VIAJE
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ─── FINALIZADO ───────────────────────────────────────────────────────────
  if (viajeEstado === "FINALIZADO") {
    const showFeedbackModal = mounted && !feedbackYaDado && !feedbackEnviado

    return (
      <div className="min-h-screen bg-background stars-bg relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-md holo-border rounded-xl p-8 text-center space-y-4 relative overflow-hidden scan-lines">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

              <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center text-2xl text-accent glow-accent">
                ✓
              </div>
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                VIAJE FINALIZADO
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu viaje llegó a destino. ¡Gracias por usar DriveMe!
              </p>

              {(feedbackEnviado || feedbackYaDado) && (
                <div className="flex flex-col gap-3 pt-2">
                  <Link
                    href="/pedir-viaje"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-glow-red text-white text-sm font-semibold glow-red transition hover:brightness-110"
                    style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
                  >
                    PEDIR NUEVO VIAJE
                  </Link>
                  <Link
                    href="/inicio"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-primary/30 text-primary text-sm font-medium transition hover:bg-primary/10"
                  >
                    Volver al inicio
                  </Link>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal de feedback obligatorio */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative holo-border rounded-xl p-6 w-full max-w-sm space-y-5 bg-card scan-lines">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

              <p
                className="text-xs text-glow-red/90 tracking-widest text-center"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                CALIFICÁ TU VIAJE
              </p>

              <div className="space-y-4">
                {/* Estrellas */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPuntaje(n)}
                      disabled={feedbackLoading}
                      className={`text-3xl transition-transform hover:scale-110 ${
                        n <= puntaje ? "text-accent" : "text-muted-foreground/30"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Comentario */}
                <textarea
                  rows={3}
                  placeholder="¿Cómo fue el viaje?"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  disabled={feedbackLoading}
                  className="w-full rounded-lg bg-input/30 border border-primary/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition disabled:opacity-50"
                />

                {feedbackError && (
                  <p className="text-xs text-destructive-foreground bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                    {feedbackError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={feedbackLoading || puntaje === 0}
                  onClick={handleEnviarFeedback}
                  className="w-full h-11 rounded-lg bg-glow-red text-white glow-red text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.75rem", letterSpacing: "0.05em" }}
                >
                  {feedbackLoading ? "ENVIANDO..." : "ENVIAR FEEDBACK"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── ACTIVO (buscando / en curso / etc.) ─────────────────────────────────
  return (
    <div className="min-h-screen bg-background stars-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />

        <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
          {/* Page title */}
          <div className="mb-6 border-b border-border/50 pb-4">
            <p
              className="text-xs text-glow-cyan/70 tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              VIAJE ACTIVO · {nombrePasajero.toUpperCase()}
            </p>
            <h1
              className="mt-1 text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {estadoMostrado.toUpperCase()}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" suppressHydrationWarning>
              Solicitud creada el {new Date(creadaEn).toLocaleString("es-AR")}
            </p>
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {/* Status card */}
              <div className="holo-border rounded-xl p-5 space-y-4 relative overflow-hidden scan-lines">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                    esBuscando
                      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      : "border-glow-cyan/30 bg-glow-cyan/10 text-glow-cyan"
                  }`}
                >
                  {estadoMostrado}
                </span>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <p
                      className="text-xs text-muted-foreground tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      ORIGEN
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {origenDireccion ?? `${origen.lat.toFixed(5)}, ${origen.lng.toFixed(5)}`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <p
                      className="text-xs text-muted-foreground tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      DESTINO
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {destinoDireccion ??
                        (destino
                          ? `${destino.lat.toFixed(5)}, ${destino.lng.toFixed(5)}`
                          : "No especificado")}
                    </p>
                  </div>
                </div>

                {idConductor && (
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <p
                      className="text-xs text-muted-foreground tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      CONDUCTOR
                    </p>
                    {loadingDriver ? (
                      <div className="mt-2 text-sm text-muted-foreground">Cargando datos del conductor…</div>
                    ) : driver ? (
                      <div className="mt-2 flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{driver.nombre}</p>
                          <p className="text-xs text-muted-foreground">Patente: {driver.patente}</p>
                          <p className="text-xs text-muted-foreground">
                            Calificación: {driver.calificacionPromedio ?? "—"}
                          </p>
                        </div>
                        <div className="ml-auto text-sm text-muted-foreground">
                          Llega en ~{driver.etaLlegadaMinutos} min
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-muted-foreground">Información no disponible</div>
                    )}
                  </div>
                )}

                {esBuscando && (
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/20 p-4 space-y-3">
                    <p className="text-sm text-yellow-200/80">
                      Tu solicitud está publicada. Un conductor se contactará pronto.
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
                      </span>
                      <span
                        className="text-2xl text-yellow-300 tabular-nums"
                        style={{ fontFamily: "var(--font-orbitron)" }}
                        suppressHydrationWarning
                      >
                        {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                      </span>
                      <span className="text-xs text-yellow-200/60">buscando…</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Map card */}
              <div className="holo-border rounded-xl p-5 relative overflow-hidden scan-lines">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
                <p
                  className="mb-3 text-xs text-muted-foreground tracking-widest"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  MAPA
                </p>
                {mapReady ? (
                  <Map origen={origen} destino={destino} />
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-border bg-card/50 text-center text-sm text-muted-foreground">
                    <span className="text-xs uppercase tracking-[0.3em] text-glow-cyan/70" style={{ fontFamily: "var(--font-orbitron)" }}>
                      CARGANDO MAPA
                    </span>
                    <span className="mt-2 max-w-[18rem]">
                      Estamos preparando el mapa del viaje para mostrarlo enseguida.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="holo-border rounded-xl p-5 space-y-3 relative overflow-hidden scan-lines">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-xl" />

                {esBuscando && (
                  <>
                    <button
                      type="button"
                      onClick={cancelar}
                      disabled={cancelando}
                      className="w-full inline-flex h-12 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelando ? "Cancelando…" : "Cancelar solicitud"}
                    </button>

                    <div className="text-center space-y-1 pt-1">
                      {autoAceptar ? (
                        <>
                          <p className="text-xs text-muted-foreground/70">
                            En {Math.max(0, 15 - elapsed)}s se acepta automáticamente.
                          </p>
                          <button
                            type="button"
                            onClick={() => setAutoAceptar(false)}
                            className="text-xs text-muted-foreground/40 underline underline-offset-2 hover:text-muted-foreground/60 transition"
                          >
                            Desactivar para probar expiración
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground/50">
                            Auto-aceptación desactivada. Expira a los 2 min.
                          </p>
                          <button
                            type="button"
                            onClick={() => { setAutoAceptar(true); autoAceptarFired.current = false }}
                            className="text-xs text-muted-foreground/40 underline underline-offset-2 hover:text-muted-foreground/60 transition"
                          >
                            Activar auto-aceptación
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-glow-cyan/20 bg-glow-cyan/5 p-5 space-y-2">
                <p
                  className="text-xs text-glow-cyan/70 tracking-widest"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  INFO
                </p>
                <p className="text-sm text-muted-foreground leading-6">
                  {esBuscando
                    ? "Podés cancelar mientras no haya un conductor aceptado."
                    : "El conductor ya aceptó tu solicitud. Solo él puede cancelar en este punto."}
                </p>
              </div>
            </aside>
          </section>
        </main>
      </div>

      {/* Modal motivos de cancelación del pasajero */}
      {showCancelMotivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative holo-border rounded-xl p-6 w-full max-w-sm space-y-4 bg-card scan-lines">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

            <p
              className="text-xs text-glow-red/90 tracking-widest text-center"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              ¿POR QUÉ CANCELASTE?
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Tocá el motivo para continuar.
            </p>

            <div className="flex flex-col gap-2">
              {MOTIVOS_CANCELACION.map((motivo) => (
                <button
                  key={motivo}
                  type="button"
                  onClick={() => router.push("/inicio")}
                  className="w-full h-11 rounded-xl border border-border text-foreground text-sm hover:border-primary/40 hover:bg-primary/5 transition text-left px-4"
                >
                  {motivo}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal solicitud expirada */}
      {isExpired && mounted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative holo-border rounded-xl p-6 w-full max-w-sm space-y-5 bg-card scan-lines">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-500/50 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-500/50 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-500/50 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-500/50 rounded-br-xl" />

            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl text-yellow-400">
                ⏱
              </div>
              <p className="text-xs text-yellow-400/80 tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
                SOLICITUD EXPIRADA
              </p>
              <p className="text-sm text-muted-foreground">
                No encontramos ningún conductor en 2 minutos. ¿Querés volver a intentarlo?
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={comentarioExpiracion}
                onChange={(e) => setComentarioExpiracion(e.target.value)}
                placeholder="¿Querés dejarnos algún comentario? (opcional)"
                className="w-full rounded-xl border border-yellow-500/20 bg-input/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-yellow-500/40 resize-none"
              />
              {comentarioExpiracion.trim() && (
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/solicitudes/${solicitudId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ comentario: comentarioExpiracion.trim() }),
                    }).catch(() => {})
                    router.push("/pedir-viaje")
                  }}
                  className="w-full h-10 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-200 text-sm font-medium transition hover:bg-yellow-500/20"
                >
                  Enviar comentario y pedir viaje
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push("/pedir-viaje")}
              className="inline-flex w-full h-11 items-center justify-center rounded-xl bg-glow-red text-white text-xs font-semibold glow-red transition hover:brightness-110"
              style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
            >
              PEDIR NUEVO VIAJE
            </button>
            <button
              type="button"
              onClick={() => router.push("/inicio")}
              className="inline-flex w-full h-10 items-center justify-center rounded-xl border border-zinc-700 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
