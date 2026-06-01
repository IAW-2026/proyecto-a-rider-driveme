import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

function EstrellasFeedback({ puntaje }: { puntaje: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`text-2xl ${n <= puntaje ? "text-yellow-400" : "text-zinc-700"}`}>★</span>
      ))}
      <span className="ml-2 text-zinc-400 text-sm self-center">{puntaje} / 5</span>
    </div>
  )
}

export default async function AdminSolicitudDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id },
    include: {
      pasajero: { select: { nombre: true, email: true, telefono: true } },
      viaje: {
        select: {
          id: true,
          estadoActual: true,
          idConductor: true,
          idCalificacion: true,
          puntajeCalificacion: true,
          comentarioCalificacion: true,
          createdAt: true,
        },
      },
    },
  })

  if (!solicitud) notFound()

  const tieneFeedback = solicitud.viaje?.puntajeCalificacion != null

  return (
    <section className="max-w-2xl">
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-red-400/70">Administración · Solicitudes</p>
        <h1 className="text-3xl font-bold">Detalle #{solicitud.id.slice(0, 8).toUpperCase()}</h1>
        <p className="text-sm text-zinc-400">
          {new Date(solicitud.creadaEn).toLocaleString("es-AR")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Pasajero */}
        <div className="space-y-1 border-b border-zinc-800/60 pb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-3">Pasajero</p>
          <p className="font-medium text-white">{solicitud.pasajero.nombre || "—"}</p>
          <p className="text-sm text-zinc-400">{solicitud.pasajero.email}</p>
          {solicitud.pasajero.telefono && (
            <p className="text-sm text-zinc-400">{solicitud.pasajero.telefono}</p>
          )}
        </div>

        {/* Viaje */}
        <div className="space-y-3 border-b border-zinc-800/60 pb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Viaje</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-zinc-500 text-xs mb-1">Origen</p>
              <p className="text-zinc-200">
                {solicitud.origenDireccion ?? `${solicitud.origenLat.toFixed(5)}, ${solicitud.origenLng.toFixed(5)}`}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Destino</p>
              <p className="text-zinc-200">
                {solicitud.destinoDireccion ?? (
                  solicitud.destinoLat != null
                    ? `${solicitud.destinoLat.toFixed(5)}, ${solicitud.destinoLng?.toFixed(5)}`
                    : "—"
                )}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Estado solicitud</p>
              <p className="text-zinc-200">{solicitud.estado}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Estado viaje</p>
              <p className="text-zinc-200">{solicitud.viaje?.estadoActual ?? "—"}</p>
            </div>
            {solicitud.precioEstimadoCents != null && (
              <div>
                <p className="text-zinc-500 text-xs mb-1">Precio</p>
                <p className="text-zinc-200">${(solicitud.precioEstimadoCents / 100).toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-zinc-500 text-xs mb-1">Método de pago</p>
              <p className="text-zinc-200">{solicitud.metodoPago}</p>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Feedback del pasajero</p>
          {tieneFeedback ? (
            <>
              <EstrellasFeedback puntaje={solicitud.viaje!.puntajeCalificacion!} />
              {solicitud.viaje?.comentarioCalificacion ? (
                <p className="text-zinc-200 text-sm leading-relaxed">&ldquo;{solicitud.viaje.comentarioCalificacion}&rdquo;</p>
              ) : (
                <p className="text-zinc-500 text-sm">Sin comentario.</p>
              )}
              {solicitud.viaje?.idCalificacion && (
                <p className="text-xs text-zinc-600 font-mono">ID: {solicitud.viaje.idCalificacion}</p>
              )}
            </>
          ) : (
            <p className="text-zinc-500 text-sm">El pasajero todavía no dejó feedback para este viaje.</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/admin/solicitudes"
          className="inline-flex h-9 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
        >
          ← Volver a solicitudes
        </Link>
      </div>
    </section>
  )
}
