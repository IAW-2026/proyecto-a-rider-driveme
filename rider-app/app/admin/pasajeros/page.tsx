import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import Link from "next/link"
import AdminFilters from "@/app/components/AdminFilters"
import AdminPagination from "@/app/components/AdminPagination"

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
        <p className="text-xs uppercase tracking-[0.4em] text-red-400">Administración</p>
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
        <p className="text-zinc-400 py-8">No se encontraron pasajeros.</p>
      ) : (
        <>
          <div className="scroll-table-wrap">
          <div className="scroll-table">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Nombre</th>
                  <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Email</th>
                  <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400 text-right">Rating</th>
                  <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400 text-right">Viajes</th>
                  <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Estado</th>
                  <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Registrado</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400"></th>
                </tr>
              </thead>
              <tbody>
                {pasajeros.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`transition hover:bg-white/[0.02] ${i < pasajeros.length - 1 ? "border-b border-zinc-800/40" : ""}`}
                  >
                    <td className="py-4 pr-6 font-medium text-white whitespace-nowrap">{p.nombre || "—"}</td>
                    <td className="py-4 pr-6 text-zinc-400 text-xs">{p.email}</td>
                    <td className="py-4 pr-6 text-right">
                      <span className="text-zinc-300">{Number(p.ratingPromedio).toFixed(1)}</span>
                      <span className="ml-1 text-zinc-400">★</span>
                    </td>
                    <td className="py-4 pr-6 text-right text-zinc-300">{p._count.solicitudes}</td>
                    <td className="py-4 pr-6">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          p.activo
                            ? "border-green-500/30 bg-green-500/10 text-green-300"
                            : "border-red-500/30 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-4 pr-6 text-zinc-400 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="py-4">
                      <Link
                        href={`/admin/pasajeros/${p.id}`}
                        className="inline-flex h-7 items-center rounded-full border border-zinc-700 px-3 text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 whitespace-nowrap"
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>

          <div className="mt-6">
            <AdminPagination
              page={pageNum}
              totalPages={totalPages}
              basePath="/admin/pasajeros"
              searchParams={q ? { q } : {}}
            />
          </div>
        </>
      )}
    </section>
  )
}
