import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import { Prisma } from "@prisma/client"
import AdminFilters from "@/app/components/AdminFilters"
import AdminPagination from "@/app/components/AdminPagination"
import AdminSimularAccion from "@/app/components/AdminSimularAccion"
import Link from "next/link"

const LIMIT = 10

function getBadge(estado: string, viajeEstado: string | null | undefined) {
  if (estado === "BUSCANDO_CONDUCTOR")
    return { label: "Buscando conductor", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
  if (estado === "ACEPTADA") {
    if (viajeEstado === "FINALIZADO")
      return { label: "Finalizado", className: "border-green-500/30 bg-green-500/10 text-green-300" }
    if (viajeEstado === "CANCELADO_POR_CONDUCTOR")
      return { label: "Cancelado por conductor", className: "border-orange-500/30 bg-orange-500/10 text-orange-300" }
    return { label: "En curso", className: "border-blue-500/30 bg-blue-500/10 text-blue-300" }
  }
  if (estado === "CANCELADA_POR_PASAJERO")
    return { label: "Cancelada", className: "border-red-500/30 bg-red-500/10 text-red-300" }
  return { label: "Expirada", className: "border-zinc-600/40 bg-zinc-800/40 text-zinc-400" }
}

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>
}) {
  const { q = "", estado = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const skip = (pageNum - 1) * LIMIT

  const where: Prisma.SolicitudDeViajeWhereInput = {}

  if (estado) {
    where.estado = estado as Prisma.EnumEstadoSolicitudFilter["equals"]
  }

  if (q) {
    where.pasajero = {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }
  }

  const [solicitudes, total] = await Promise.all([
    prisma.solicitudDeViaje.findMany({
      where,
      skip,
      take: LIMIT,
      orderBy: { creadaEn: "desc" },
      include: {
        pasajero: { select: { nombre: true, email: true } },
        viaje: { select: { estadoActual: true, puntajeCalificacion: true, comentarioCalificacion: true } },
      },
    }),
    prisma.solicitudDeViaje.count({ where }),
  ])

  const totalPages = Math.ceil(total / LIMIT)
  const paginationParams: Record<string, string> = {}
  if (q) paginationParams.q = q
  if (estado) paginationParams.estado = estado

  return (
    <section>
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-red-400/70">Administración</p>
        <h1 className="text-3xl font-bold">Solicitudes</h1>
        <p className="text-sm text-zinc-400">
          {total} solicitud{total !== 1 ? "es" : ""}
          {q && <> que coinciden con <span className="text-zinc-200">&ldquo;{q}&rdquo;</span></>}
          {estado && (
            <> · estado: <span className="text-zinc-200">{getBadge(estado, null).label}</span></>
          )}
        </p>
      </div>

      <div className="mb-6">
        <Suspense>
          <AdminFilters showEstado initialQ={q} initialEstado={estado} />
        </Suspense>
      </div>

      {solicitudes.length === 0 ? (
        <p className="text-zinc-500 py-8">No se encontraron solicitudes.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">ID</th>
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Pasajero</th>
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Origen</th>
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Destino</th>
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Estado</th>
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 text-right">Precio</th>
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Pago</th>
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Fecha</th>
                  <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Acción</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s, i) => {
                  const badge = getBadge(s.estado, s.viaje?.estadoActual)
                  return (
                    <tr
                      key={s.id}
                      className={`transition hover:bg-white/[0.02] ${i < solicitudes.length - 1 ? "border-b border-zinc-800/40" : ""}`}
                    >
                      <td className="py-3 pr-3 font-mono text-xs text-zinc-500 whitespace-nowrap">
                        {s.id.slice(0, 8)}…
                      </td>
                      <td className="py-3 pr-3 max-w-[160px]">
                        <p className="font-medium text-white truncate">{s.pasajero.nombre || "—"}</p>
                        <p className="text-xs text-zinc-500 truncate">{s.pasajero.email}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-zinc-400 max-w-[160px]">
                        <span className="truncate block">{s.origenDireccion ?? `${s.origenLat.toFixed(4)}, ${s.origenLng.toFixed(4)}`}</span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-zinc-400 max-w-[160px]">
                        <span className="truncate block">
                          {s.destinoDireccion ?? (s.destinoLat != null ? `${s.destinoLat.toFixed(4)}, ${s.destinoLng?.toFixed(4)}` : "—")}
                        </span>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right text-zinc-300 whitespace-nowrap">
                        {s.precioEstimadoCents != null
                          ? `$${(s.precioEstimadoCents / 100).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-400 whitespace-nowrap">{s.metodoPago}</td>
                      <td className="py-3 pr-3 text-zinc-500 whitespace-nowrap">
                        {new Date(s.creadaEn).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <AdminSimularAccion
                          solicitudId={s.id}
                          estado={s.estado}
                          viajeEstado={s.viaje?.estadoActual ?? null}
                        />
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <Link
                          href={`/admin/solicitudes/${s.id}`}
                          className="inline-flex h-7 items-center rounded-full border border-zinc-700 px-3 text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
                        >
                          Detalles
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <AdminPagination
              page={pageNum}
              totalPages={totalPages}
              basePath="/admin/solicitudes"
              searchParams={paginationParams}
            />
          </div>
        </>
      )}
    </section>
  )
}
