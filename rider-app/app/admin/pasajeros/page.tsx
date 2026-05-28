import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import AdminFilters from "@/app/components/AdminFilters"
import AdminPagination from "@/app/components/AdminPagination"
import ToggleActivoPasajero from "@/app/components/ToggleActivoPasajero"

const LIMIT = 10

export default async function AdminPasajerosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const skip = (pageNum - 1) * LIMIT

  const where = q
    ? {
        OR: [
          { nombre: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [pasajeros, total] = await Promise.all([
    prisma.pasajero.findMany({
      where,
      skip,
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        ratingPromedio: true,
        activo: true,
        createdAt: true,
        _count: { select: { solicitudes: true } },
      },
    }),
    prisma.pasajero.count({ where }),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <section>
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-red-400/70">Administración</p>
        <h1 className="text-3xl font-bold">Pasajeros</h1>
        <p className="text-sm text-zinc-400">
          {total} pasajero{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
          {q && <> que coinciden con <span className="text-zinc-200">&ldquo;{q}&rdquo;</span></>}
        </p>
      </div>

      <div className="mb-6">
        <Suspense>
          <AdminFilters initialQ={q} />
        </Suspense>
      </div>

      {pasajeros.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 px-6 py-16 text-center">
          <p className="text-zinc-500">No se encontraron pasajeros.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Nombre</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Teléfono</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 text-right">Rating</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 text-right">Viajes</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Registrado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pasajeros.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`transition hover:bg-white/[0.02] ${i < pasajeros.length - 1 ? "border-b border-zinc-800/60" : ""}`}
                  >
                    <td className="px-6 py-4 font-medium text-white">{p.nombre || "—"}</td>
                    <td className="px-6 py-4 text-zinc-400">{p.email}</td>
                    <td className="px-6 py-4 text-zinc-400">{p.telefono ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-zinc-300">{Number(p.ratingPromedio).toFixed(1)}</span>
                      <span className="ml-1 text-zinc-600">★</span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-300">{p._count.solicitudes}</td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(p.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-6 py-4">
                      <ToggleActivoPasajero id={p.id} activo={p.activo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 pb-6">
            <AdminPagination
              page={pageNum}
              totalPages={totalPages}
              basePath="/admin/pasajeros"
              searchParams={q ? { q } : {}}
            />
          </div>
        </div>
      )}
    </section>
  )
}
