"use client"

import { useState, useEffect } from "react"
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
  idConductor: string | null
  creadaEn: string
  nombrePasajero: string
}

const ESTADO_LABEL: Record<string, string> = {
  BUSCANDO_CONDUCTOR: "Buscando conductor…",
  ACEPTADA: "Conductor asignado",
  ACEPTADO: "Conductor confirmado",
  EN_CURSO: "Viaje en curso",
  FINALIZADO: "Viaje finalizado",
  CANCELADO_POR_CONDUCTOR: "Cancelado por el conductor",
}

export default function ViajeActivoCliente({
  solicitudId,
  estado,
  origen,
  origenDireccion,
  destino,
  destinoDireccion,
  viajeEstado,
  idConductor,
  creadaEn,
  nombrePasajero,
}: Props) {
  const router = useRouter()
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [driver, setDriver] = useState<any | null>(null)
  const [loadingDriver, setLoadingDriver] = useState(false)

  const esBuscando = estado === "BUSCANDO_CONDUCTOR"
  const estadoMostrado =
    viajeEstado
      ? (ESTADO_LABEL[viajeEstado] ?? viajeEstado)
      : (ESTADO_LABEL[estado] ?? estado)

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
        router.push("/inicio")
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

  if (viajeEstado === "FINALIZADO" || viajeEstado === "CANCELADO_POR_CONDUCTOR") {
    const esCancelado = viajeEstado === "CANCELADO_POR_CONDUCTOR"
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

              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl ${
                  esCancelado
                    ? "bg-destructive/20 text-destructive glow-red"
                    : "bg-accent/20 text-accent glow-accent"
                }`}
              >
                {esCancelado ? "✕" : "✓"}
              </div>

              <h1
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                {esCancelado ? "VIAJE CANCELADO" : "VIAJE FINALIZADO"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {esCancelado
                  ? "El conductor canceló el viaje. Podés pedir uno nuevo cuando quieras."
                  : "Tu viaje llegó a destino. ¡Gracias por usar DriveMe!"}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {!esCancelado && (
                  <Link
                    href={`/historial/${solicitudId}`}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold glow-accent transition hover:brightness-110"
                    style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
                  >
                    DEJAR FEEDBACK
                  </Link>
                )}
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
            </div>
          </main>
        </div>
      </div>
    )
  }

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
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/20 p-4">
                    <p className="text-sm text-yellow-200/80">
                      Tu solicitud está publicada. Un conductor la aceptará en breve.
                    </p>
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
                <Map origen={origen} destino={destino} />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="holo-border rounded-xl p-5 space-y-3 relative overflow-hidden scan-lines">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-xl" />

                <p
                  className="text-xs text-muted-foreground tracking-widest"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  ACCIONES
                </p>

                {esBuscando && (
                  <button
                    type="button"
                    onClick={cancelar}
                    disabled={cancelando}
                    className="w-full inline-flex h-12 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelando ? "Cancelando…" : "Cancelar solicitud"}
                  </button>
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
    </div>
  )
}
