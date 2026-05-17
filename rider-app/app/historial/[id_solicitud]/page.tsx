import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getConductorById } from "@/lib/conductores"
import FeedbackActions from "./FeedbackActions"
import MapDetalle from "./MapDetalle"
import { AppHeader } from "../../components/AppHeader"

function getBadge(estado: string, viajeEstado: string | null | undefined) {
  if (estado === "CANCELADA_POR_PASAJERO") {
    return { label: "Cancelaste este viaje", className: "border-destructive/30 bg-destructive/10 text-destructive-foreground" }
  }
  if (estado === "ACEPTADA") {
    if (viajeEstado === "FINALIZADO") {
      return { label: "Viaje finalizado", className: "border-accent/30 bg-accent/10 text-accent" }
    }
    if (viajeEstado === "CANCELADO_POR_CONDUCTOR") {
      return { label: "El conductor canceló", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
    }
    return { label: "En curso", className: "border-primary/30 bg-primary/10 text-primary" }
  }
  return { label: estado, className: "border-border bg-muted/40 text-muted-foreground" }
}

export default async function HistorialDetallePage({
  params,
}: {
  params: Promise<{ id_solicitud: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: userId },
    select: { id: true, nombre: true },
  })

  if (!pasajero) redirect("/inicio")

  const { id_solicitud } = await params

  const solicitud = await prisma.solicitudDeViaje.findFirst({
    where: {
      id: id_solicitud,
      pasajeroId: pasajero.id,
    },
    include: {
      viaje: {
        select: {
          id: true,
          idConductor: true,
          estadoActual: true,
          idCalificacion: true,
        },
      },
    },
  })

  if (!solicitud) redirect("/historial")

  const esViajeFinalizado = solicitud.estado === "ACEPTADA" && solicitud.viaje?.estadoActual === "FINALIZADO"
  const esCanceladoPorConductor = solicitud.estado === "ACEPTADA" && solicitud.viaje?.estadoActual === "CANCELADO_POR_CONDUCTOR"
  const esCanceladoPorPasajero = solicitud.estado === "CANCELADA_POR_PASAJERO"

  if (!esViajeFinalizado && !esCanceladoPorConductor && !esCanceladoPorPasajero) {
    redirect("/historial")
  }

  const conductor = solicitud.viaje?.idConductor ? await getConductorById(solicitud.viaje.idConductor) : null
  const badge = getBadge(solicitud.estado, solicitud.viaje?.estadoActual)

  return (
    <div className="min-h-screen bg-background stars-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />

        <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
          <div className="mb-6 flex flex-col gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="text-xs text-glow-cyan/70 tracking-widest"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                HISTORIAL · DETALLE
              </p>
              <h1
                className="mt-1 text-2xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                VIAJE #{solicitud.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(solicitud.creadaEn).toLocaleString("es-AR")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/historial"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border text-muted-foreground px-4 text-sm transition hover:border-primary/30 hover:text-foreground"
              >
                Volver al historial
              </Link>
              <Link
                href="/inicio"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border text-muted-foreground px-4 text-sm transition hover:border-primary/30 hover:text-foreground"
              >
                Volver al inicio
              </Link>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {/* Main info card */}
              <div className="holo-border rounded-xl p-5 space-y-4 relative overflow-hidden scan-lines">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/60">
                    {solicitud.id.slice(0, 8)}…
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <p
                      className="text-xs text-muted-foreground tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      ORIGEN
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {solicitud.origenDireccion ?? `${solicitud.origenLat.toFixed(5)}, ${solicitud.origenLng.toFixed(5)}`}
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
                      {solicitud.destinoDireccion ??
                        (solicitud.destinoLat != null && solicitud.destinoLng != null
                          ? `${solicitud.destinoLat.toFixed(5)}, ${solicitud.destinoLng.toFixed(5)}`
                          : "No especificado")}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-4">
                  <p
                    className="text-xs text-muted-foreground tracking-widest"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    VIAJE
                  </p>
                  <p className="mt-2 text-sm text-foreground/80">
                    {esViajeFinalizado
                      ? "Este viaje terminó correctamente. Ya podés dejar feedback."
                      : esCanceladoPorConductor
                        ? "El conductor canceló el viaje. Podés revisar el detalle y dejar un reporte si lo necesitás."
                        : "Cancelaste la solicitud antes de que un conductor la tomara."}
                  </p>
                </div>

                {conductor && (
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <p
                      className="text-xs text-muted-foreground tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      CONDUCTOR
                    </p>
                    <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{conductor.nombre}</p>
                        <p className="text-xs text-muted-foreground">Patente: {conductor.patente}</p>
                        <p className="text-xs text-muted-foreground">Calificación: {conductor.calificacionPromedio}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">ETA estimada: {conductor.etaLlegadaMinutos} min</p>
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
                <MapDetalle
                  origen={{ lat: solicitud.origenLat, lng: solicitud.origenLng }}
                  destino={
                    solicitud.destinoLat != null && solicitud.destinoLng != null
                      ? { lat: solicitud.destinoLat, lng: solicitud.destinoLng }
                      : null
                  }
                />
              </div>
            </div>

            <aside className="space-y-4">
              {!esCanceladoPorPasajero && (
                <FeedbackActions
                  viajeId={solicitud.viaje?.id ?? null}
                  conductorId={solicitud.viaje?.idConductor ?? null}
                  idCalificacion={solicitud.viaje?.idCalificacion ?? null}
                  sinEstrellas={esCanceladoPorConductor}
                />
              )}
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
