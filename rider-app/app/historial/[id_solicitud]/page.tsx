import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { obtenerTransaccionViaje } from "@/lib/payments"
import FeedbackActions from "./FeedbackActions"
import MapDetalle from "./MapDetalle"
import { AppHeader } from "../../components/AppHeader"

function getBadge(estado: string, viajeEstado: string | null | undefined) {
  if (estado === "CANCELADA_POR_PASAJERO") {
    return { label: "Cancelaste este viaje", className: "border-destructive/30 bg-destructive/10 text-destructive-foreground" }
  }
  if (estado === "EXPIRADA_SIN_ACEPTACION") {
    return { label: "Sin conductor disponible", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
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
          idVehiculo: true,
          idViajeDriver: true,
          estadoActual: true,
          patente: true,
          puntajePromedioConductor: true,
          comentarioPromedioConductor: true,
          idCalificacion: true,
          puntajeCalificacion: true,
          comentarioCalificacion: true,
        },
      },
    },
  })

  if (!solicitud) redirect("/historial")

  const esViajeFinalizado = solicitud.estado === "ACEPTADA" && solicitud.viaje?.estadoActual === "FINALIZADO"
  const esCanceladoPorConductor = solicitud.estado === "ACEPTADA" && solicitud.viaje?.estadoActual === "CANCELADO_POR_CONDUCTOR"
  const esCanceladoPorPasajero = solicitud.estado === "CANCELADA_POR_PASAJERO"
  const esExpirada = solicitud.estado === "EXPIRADA_SIN_ACEPTACION"

  if (!esViajeFinalizado && !esCanceladoPorConductor && !esCanceladoPorPasajero && !esExpirada) {
    redirect("/historial")
  }

  const transaccion = solicitud.viaje ? await obtenerTransaccionViaje(solicitud.viaje.id) : null
  const patente = solicitud.viaje?.patente ?? null
  const puntajeConductor = solicitud.viaje?.puntajePromedioConductor ? Number(solicitud.viaje.puntajePromedioConductor) : null
  const idVehiculo = solicitud.viaje?.idVehiculo ?? null
  const idViajeDriver = solicitud.viaje?.idViajeDriver ?? null
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
                  <div className="rounded-xl border border-border bg-card p-4">
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
                  <div className="rounded-xl border border-border bg-card p-4">
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

                <div className="rounded-xl border border-border bg-card p-4">
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
                        : esExpirada
                          ? "Ningún conductor tomó la solicitud en 2 minutos y expiró automáticamente."
                          : "Cancelaste la solicitud antes de que un conductor la tomara."}
                  </p>
                </div>

                {esExpirada && solicitud.comentarioExpiracion && (
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <p
                      className="text-xs text-yellow-400/70 tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      TU COMENTARIO
                    </p>
                    <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                      &ldquo;{solicitud.comentarioExpiracion}&rdquo;
                    </p>
                  </div>
                )}

                {patente && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p
                      className="text-xs text-muted-foreground tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      CONDUCTOR
                    </p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-muted-foreground">Patente: {patente}</p>
                      <p className="text-xs text-muted-foreground">Calificación: {puntajeConductor ?? "—"}</p>
                    </div>
                  </div>
                )}

                {solicitud.viaje && (idVehiculo || idViajeDriver) && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p
                      className="text-xs text-muted-foreground tracking-widest"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      VIAJE ASIGNADO
                    </p>
                    <div className="mt-2 grid gap-1">
                      <p className="text-xs text-muted-foreground">
                        ID Rider:{" "}
                        <span className="font-mono text-foreground/80">
                          {solicitud.viaje.id.slice(0, 8).toUpperCase()}
                        </span>
                      </p>
                      {idViajeDriver && (
                        <p className="text-xs text-muted-foreground">
                          ID Driver:{" "}
                          <span className="font-mono text-foreground/80">
                            {idViajeDriver.slice(0, 8).toUpperCase()}
                          </span>
                        </p>
                      )}
                      {idVehiculo && (
                        <p className="text-xs text-muted-foreground">
                          Vehículo:{" "}
                          <span className="font-mono text-foreground/80">{idVehiculo}</span>
                        </p>
                      )}
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
              {esExpirada ? (
                <div className="holo-border rounded-xl p-5 space-y-3 relative overflow-hidden scan-lines">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-yellow-500/30 rounded-tl-xl" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No se encontró conductor en el tiempo límite. Podés volver a intentarlo cuando quieras.
                  </p>
                  <Link
                    href="/inicio"
                    className="inline-flex w-full h-11 items-center justify-center rounded-xl bg-glow-red text-white text-xs font-semibold glow-red transition hover:brightness-110"
                    style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
                  >
                    PEDIR NUEVO VIAJE
                  </Link>
                </div>
              ) : !esCanceladoPorPasajero ? (
                <FeedbackActions
                  viajeId={solicitud.viaje?.id ?? null}
                  conductorId={solicitud.viaje?.idConductor ?? null}
                  idCalificacion={solicitud.viaje?.idCalificacion ?? null}
                  puntajeGuardado={solicitud.viaje?.puntajeCalificacion ?? null}
                  comentarioGuardado={solicitud.viaje?.comentarioCalificacion ?? null}
                  sinEstrellas={esCanceladoPorConductor}
                />
              ) : null}

              {(esViajeFinalizado || esCanceladoPorConductor) && (
                <div className="holo-border rounded-xl p-5 space-y-3 relative overflow-hidden scan-lines">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-glow-cyan/40 rounded-tl-xl" />
                  <p
                    className="text-xs text-glow-cyan/70 tracking-widest"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    PAGO
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Método</span>
                      <span className="text-sm text-foreground">{solicitud.metodoPago}</span>
                    </div>
                    {solicitud.precioEstimadoCents != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Precio estimado</span>
                        <span className="text-sm text-foreground">
                          $ {(solicitud.precioEstimadoCents / 100).toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}
                    {transaccion && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Estado</span>
                          <span
                            className={`text-sm font-medium ${
                              transaccion.estado === "CAPTURED"
                                ? "text-accent"
                                : transaccion.estado === "FAILED"
                                  ? "text-destructive-foreground"
                                  : "text-foreground"
                            }`}
                          >
                            {transaccion.estado === "CAPTURED"
                              ? "Pago confirmado"
                              : transaccion.estado === "FAILED"
                                ? "Pago fallido"
                                : transaccion.estado}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Monto cobrado</span>
                          <span className="text-sm font-medium text-foreground">
                            $ {transaccion.monto.toLocaleString("es-AR")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">ID transacción</span>
                          <span className="font-mono text-xs text-muted-foreground/60">
                            {transaccion.idTransaccion.slice(0, 8)}…
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Fecha</span>
                          <span className="text-xs text-muted-foreground/70">
                            {new Date(transaccion.fechaCreacion).toLocaleString("es-AR")}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
