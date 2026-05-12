import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import { Prisma } from "@prisma/client"
import AdminFilters from "@/app/components/AdminFilters"
import AdminPagination from "@/app/components/AdminPagination"

const LIMIT = 10

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  BUSCANDO_CONDUCTOR: {
    label: "Buscando conductor",
    className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
  },
  ACEPTADA: {
    label: "Aceptada",
    className: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  },
  CANCELADA_POR_PASAJERO: {
    label: "Cancelada",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
  },
  EXPIRADA_SIN_ACEPTACION: {
    label: "Expirada",
    className: "border-zinc-600/40 bg-zinc-800/40 text-zinc-400",
  },
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
            <> · estado: <span className="text-zinc-200">{ESTADO_BADGE[estado]?.label ?? estado}</span></>
          )}
        </p>
      </div>

      <div className="mb-6">
        <Suspense>
          <AdminFilters showEstado initialQ={q} initialEstado={estado} />
        </Suspense>
      </div>

      {solicitudes.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 px-6 py-16 text-center">
          <p className="text-zinc-500">No se encontraron solicitudes.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">ID</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Pasajero</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Origen</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Destino</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 text-right">Precio</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Pago</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s, i) => {
                  const badge = ESTADO_BADGE[s.estado] ?? { label: s.estado, className: "border-zinc-600 text-zinc-400" }
                  return (
                    <tr
                      key={s.id}
                      className={`transition hover:bg-white/[0.02] ${i < solicitudes.length - 1 ? "border-b border-zinc-800/60" : ""}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                        {s.id.slice(0, 8)}…
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{s.pasajero.nombre || "—"}</p>
                        <p className="text-xs text-zinc-500">{s.pasajero.email}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                        {s.origenLat.toFixed(4)}, {s.origenLng.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                        {s.destinoLat != null
                          ? `${s.destinoLat.toFixed(4)}, ${s.destinoLng?.toFixed(4)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-300">
                        {s.precioEstimadoCents != null
                          ? `$${(s.precioEstimadoCents / 100).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{s.metodoPago}</td>
                      <td className="px-6 py-4 text-zinc-500">
                        {new Date(s.creadaEn).toLocaleDateString("es-AR")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 pb-6">
            <AdminPagination
              page={pageNum}
              totalPages={totalPages}
              basePath="/admin/solicitudes"
              searchParams={paginationParams}
            />
          </div>
        </div>
      )}
    </section>
  )
}
