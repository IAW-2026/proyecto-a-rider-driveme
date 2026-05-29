import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import ToggleActivoPasajero from "@/app/components/ToggleActivoPasajero"

function getBadgeSolicitud(estado: string, viajeEstado: string | null | undefined) {
  if (estado === "BUSCANDO_CONDUCTOR") return { label: "Buscando conductor", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300" }
  if (estado === "CANCELADA_POR_PASAJERO") return { label: "Cancelada", className: "border-red-500/30 bg-red-500/10 text-red-300" }
  if (estado === "EXPIRADA_SIN_ACEPTACION") return { label: "Expirada", className: "border-zinc-600/40 bg-zinc-800/40 text-zinc-400" }
  if (estado === "ACEPTADA") {
    if (viajeEstado === "FINALIZADO") return { label: "Completado", className: "border-green-500/30 bg-green-500/10 text-green-300" }
    if (viajeEstado === "CANCELADO_POR_CONDUCTOR") return { label: "Cancelado por conductor", className: "border-orange-500/30 bg-orange-500/10 text-orange-300" }
    if (viajeEstado === "EN_CURSO") return { label: "En curso", className: "border-blue-500/30 bg-blue-500/10 text-blue-300" }
    return { label: "Aceptado", className: "border-purple-500/30 bg-purple-500/10 text-purple-300" }
  }
  return { label: estado, className: "border-zinc-700 bg-zinc-800/40 text-zinc-400" }
}

export default async function AdminPasajeroDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const pasajero = await prisma.pasajero.findUnique({
    where: { id },
    include: {
      direcciones: { orderBy: { createdAt: "asc" } },
      solicitudes: {
        orderBy: { creadaEn: "desc" },
        take: 10,
        include: { viaje: { select: { estadoActual: true, puntajeCalificacion: true } } },
      },
      _count: { select: { solicitudes: true, direcciones: true } },
    },
  })

  if (!pasajero) notFound()

  const totalSolicitudes = pasajero._count.solicitudes
  const completados = pasajero.solicitudes.filter(
    (s) => s.estado === "ACEPTADA" && s.viaje?.estadoActual === "FINALIZADO"
  ).length
  const cancelados = pasajero.solicitudes.filter(
    (s) => s.estado === "CANCELADA_POR_PASAJERO" || s.viaje?.estadoActual === "CANCELADO_POR_CONDUCTOR"
  ).length

  return (
    <section className="max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/pasajeros"
          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-zinc-700 bg-white/5 px-3 text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
        >
          ← Volver
        </Link>
        <p className="text-xs uppercase tracking-[0.4em] text-red-400/70">Administración · Pasajeros</p>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{pasajero.nombre}</h1>
          <p className="mt-1 text-sm text-zinc-400">{pasajero.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
              pasajero.activo
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {pasajero.activo ? "Activo" : "Inactivo"}
          </span>
          <ToggleActivoPasajero id={pasajero.id} activo={pasajero.activo} />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Solicitudes totales", value: totalSolicitudes },
          { label: "Viajes completados", value: completados },
          { label: "Cancelados", value: cancelados },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-center"
          >
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Info personal */}
      <div className="mb-6 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          Información personal
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Teléfono" value={pasajero.telefono ?? "—"} />
          <Row
            label="Rating promedio"
            value={
              <span className="flex items-center gap-1">
                <span className="text-white">{Number(pasajero.ratingPromedio).toFixed(2)}</span>
                <span className="text-yellow-400">★</span>
              </span>
            }
          />
          <Row
            label="Comentario promedio"
            value={pasajero.comentarioPromedio ?? "—"}
            full
          />
          <Row label="Registrado" value={new Date(pasajero.createdAt).toLocaleString("es-AR")} />
          <Row label="Último update" value={new Date(pasajero.updatedAt).toLocaleString("es-AR")} />
          <Row label="ID interno" value={<span className="font-mono text-xs text-zinc-400">{pasajero.id}</span>} full />
          <Row label="Clerk ID" value={<span className="font-mono text-xs text-zinc-400">{pasajero.clerkId}</span>} full />
        </div>
      </div>

      {/* Direcciones frecuentes */}
      <div className="mb-6 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          Direcciones frecuentes{" "}
          <span className="ml-1 text-zinc-600">({pasajero._count.direcciones})</span>
        </h2>
        {pasajero.direcciones.length === 0 ? (
          <p className="text-sm text-zinc-600">Sin direcciones guardadas.</p>
        ) : (
          <div className="space-y-2">
            {pasajero.direcciones.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-0.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">{d.nombre}</p>
                  <p className="text-xs text-zinc-400">{d.direccion ?? "Sin dirección legible"}</p>
                </div>
                <p className="text-xs text-zinc-600 font-mono whitespace-nowrap">
                  {d.latitud.toFixed(5)}, {d.longitud.toFixed(5)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Últimas solicitudes */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Últimas solicitudes
          </h2>
        </div>
        {pasajero.solicitudes.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-600">Sin solicitudes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Origen</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Destino</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 text-right">Precio</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pasajero.solicitudes.map((s, i) => {
                  const badge = getBadgeSolicitud(s.estado, s.viaje?.estadoActual)
                  return (
                    <tr
                      key={s.id}
                      className={`transition hover:bg-white/[0.02] ${i < pasajero.solicitudes.length - 1 ? "border-b border-zinc-800/60" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 whitespace-nowrap">
                        {s.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[160px]">
                        <span className="truncate block">
                          {s.origenDireccion ?? `${s.origenLat.toFixed(4)}, ${s.origenLng.toFixed(4)}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[160px]">
                        <span className="truncate block">
                          {s.destinoDireccion ?? (s.destinoLat != null ? `${s.destinoLat.toFixed(4)}, ${s.destinoLng?.toFixed(4)}` : "—")}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300 whitespace-nowrap">
                        {s.precioEstimadoCents != null
                          ? `$${(s.precioEstimadoCents / 100).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(s.creadaEn).toLocaleDateString("es-AR")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  full,
}: {
  label: string
  value: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className="text-sm text-zinc-200">{value}</p>
    </div>
  )
}
