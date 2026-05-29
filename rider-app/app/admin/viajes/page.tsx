import { prisma } from "@/lib/prisma"
import AdminPagination from "@/app/components/AdminPagination"

const LIMIT = 10

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  ACEPTADO:               { label: "Aceptado",            color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  EN_CURSO:               { label: "En curso",            color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  FINALIZADO:             { label: "Finalizado",          color: "text-green-400 bg-green-400/10 border-green-400/30" },
  CANCELADO_POR_CONDUCTOR:{ label: "Cancelado conductor", color: "text-red-400 bg-red-400/10 border-red-400/30" },
}

export default async function AdminViajesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; page?: string }>
}) {
  const { estado = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const skip = (pageNum - 1) * LIMIT

  const where = estado ? { estadoActual: estado as never } : {}

  const [viajes, total, stats] = await Promise.all([
    prisma.viaje.findMany({
      where,
      skip,
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        estadoActual: true,
        idConductor: true,
        puntajeCalificacion: true,
        createdAt: true,
        solicitud: {
          select: {
            origenDireccion: true,
            destinoDireccion: true,
            precioEstimadoCents: true,
            pasajero: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.viaje.count({ where }),
    prisma.viaje.groupBy({ by: ["estadoActual"], _count: { _all: true } }),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  const statsMap = Object.fromEntries(stats.map((s) => [s.estadoActual, s._count._all]))

  const estados = ["ACEPTADO", "EN_CURSO", "FINALIZADO", "CANCELADO_POR_CONDUCTOR"]

  return (
    <section>
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-red-400/70">Administración</p>
        <h1 className="text-3xl font-bold">Viajes</h1>
        <p className="text-sm text-zinc-400">
          {total} viaje{total !== 1 ? "s" : ""}
          {estado && (
            <> filtrados por <span className="text-zinc-200">{ESTADO_LABEL[estado]?.label ?? estado}</span></>
          )}
        </p>
      </div>

      {/* Stats por estado */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {estados.map((e) => {
          const info = ESTADO_LABEL[e]
          return (
            <a
              key={e}
              href={`/admin/viajes?estado=${e}`}
              className={`rounded-2xl border px-4 py-4 transition hover:brightness-110 ${estado === e ? info.color : "border-zinc-800 bg-zinc-950/50"}`}
            >
              <p className={`text-2xl font-bold ${estado === e ? "" : "text-white"}`}>
                {statsMap[e] ?? 0}
              </p>
              <p className={`mt-1 text-xs ${estado === e ? "" : "text-zinc-500"}`}>{info.label}</p>
            </a>
          )
        })}
      </div>

      {/* Filtro activo — botón para limpiar */}
      {estado && (
        <div className="mb-4">
          <a
            href="/admin/viajes"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition"
          >
            ✕ Limpiar filtro
          </a>
        </div>
      )}

      {viajes.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 px-6 py-16 text-center">
          <p className="text-zinc-500">No hay viajes{estado ? " en este estado" : ""}.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">ID</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Pasajero</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Origen → Destino</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 text-right">Precio</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 text-right">Rating</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {viajes.map((v, i) => {
                  const info = ESTADO_LABEL[v.estadoActual] ?? { label: v.estadoActual, color: "text-zinc-400 bg-zinc-800 border-zinc-700" }
                  return (
                    <tr
                      key={v.id}
                      className={`transition hover:bg-white/[0.02] ${i < viajes.length - 1 ? "border-b border-zinc-800/60" : ""}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{v.id.slice(0, 8)}…</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${info.color}`}>
                          {info.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{v.solicitud.pasajero.nombre || "—"}</td>
                      <td className="px-6 py-4 text-zinc-400 max-w-xs">
                        <p className="truncate text-xs">{v.solicitud.origenDireccion ?? "—"}</p>
                        <p className="truncate text-xs text-zinc-600">{v.solicitud.destinoDireccion ?? "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-300">
                        ${((v.solicitud.precioEstimadoCents ?? 0) / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {v.puntajeCalificacion != null ? (
                          <span className="text-zinc-300">{v.puntajeCalificacion} <span className="text-zinc-600">★</span></span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {new Date(v.createdAt).toLocaleDateString("es-AR")}
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
              basePath="/admin/viajes"
              searchParams={estado ? { estado } : {}}
            />
          </div>
        </div>
      )}
    </section>
  )
}
