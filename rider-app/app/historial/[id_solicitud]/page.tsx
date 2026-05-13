import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getConductorById } from "@/lib/conductores"
import FeedbackActions from "./FeedbackActions"
import MapDetalle from "./MapDetalle"

function getBadge(estado: string, viajeEstado: string | null | undefined) {
  if (estado === "CANCELADA_POR_PASAJERO") {
    return { label: "Cancelaste este viaje", className: "border-red-500/30 bg-red-500/10 text-red-300" }
  }
  if (estado === "ACEPTADA") {
    if (viajeEstado === "FINALIZADO") {
      return { label: "Viaje finalizado", className: "border-green-500/30 bg-green-500/10 text-green-300" }
    }
    if (viajeEstado === "CANCELADO_POR_CONDUCTOR") {
      return { label: "El conductor canceló", className: "border-orange-500/30 bg-orange-500/10 text-orange-300" }
    }
    return { label: "En curso", className: "border-blue-500/30 bg-blue-500/10 text-blue-300" }
  }
  return { label: estado, className: "border-zinc-600/40 bg-zinc-800/40 text-zinc-400" }
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
  const puedeFeedback = esViajeFinalizado && Boolean(solicitud.viaje?.id)

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,180,255,0.12),transparent),radial-gradient(ellipse_60%_50%_at_15%_80%,rgba(255,0,0,0.10),transparent)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Historial · detalle</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Viaje #{solicitud.id.slice(0, 8)}</h1>
            <p className="mt-2 text-sm text-zinc-400">{new Date(solicitud.creadaEn).toLocaleString("es-AR")}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/historial"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-white/10"
            >
              Volver al historial
            </Link>
            <Link
              href="/inicio"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-white/10"
            >
              Volver al inicio
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="font-mono text-xs text-zinc-600">{solicitud.id.slice(0, 8)}…</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Origen</p>
                  <p className="mt-2 text-sm font-medium text-zinc-200">
                    {solicitud.origenDireccion ?? `${solicitud.origenLat.toFixed(5)}, ${solicitud.origenLng.toFixed(5)}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Destino</p>
                  <p className="mt-2 text-sm font-medium text-zinc-200">
                    {solicitud.destinoDireccion ?? (solicitud.destinoLat != null && solicitud.destinoLng != null ? `${solicitud.destinoLat.toFixed(5)}, ${solicitud.destinoLng.toFixed(5)}` : "No especificado")}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Viaje</p>
                <p className="mt-2 text-sm text-zinc-300">
                  {esViajeFinalizado
                    ? "Este viaje terminó correctamente. Ya podés dejar feedback."
                    : esCanceladoPorConductor
                      ? "El conductor canceló el viaje. Podés revisar el detalle y dejar un reporte si lo necesitás."
                      : "Cancelaste la solicitud antes de que un conductor la tomara."}
                </p>
              </div>

              {conductor && (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Conductor</p>
                  <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{conductor.nombre}</p>
                      <p className="text-xs text-zinc-400">Patente: {conductor.patente}</p>
                      <p className="text-xs text-zinc-400">Calificación: {conductor.calificacionPromedio}</p>
                    </div>
                    <p className="text-xs text-zinc-500">ETA estimada: {conductor.etaLlegadaMinutos} min</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 sm:p-8">
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">Mapa</p>
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

          <aside className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-cyan-950/40 to-black/60 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Acciones</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Desde este detalle podés dejar feedback y, una vez generado, enviar un reporte a la app de feedback.
              </p>
            </div>

            <FeedbackActions
              viajeId={solicitud.viaje?.id ?? null}
              conductorId={solicitud.viaje?.idConductor ?? null}
              puedeDejarFeedback={puedeFeedback}
            />
          </aside>
        </section>
      </div>
    </main>
  )
}