import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Suspense } from "react"
import { Prisma } from "@prisma/client"
import { AppHeader } from "../components/AppHeader"
import { requirePasajeroActivo } from "@/lib/requirePasajeroActivo"
import HistorialFilters from "./HistorialFilters"

const LIMIT = 8

function getEstadoBadge(estado: string, viajeEstado: string | null | undefined) {
  if (estado === "CANCELADA_POR_PASAJERO")
    return { label: "Misión abortada", className: "border-destructive/30 bg-destructive/10 text-destructive-foreground" }
  if (estado === "ACEPTADA") {
    if (viajeEstado === "FINALIZADO")
      return { label: "Misión completada", className: "border-accent/30 bg-accent/10 text-accent" }
    if (viajeEstado === "CANCELADO_POR_CONDUCTOR")
      return { label: "Piloto Imperial canceló", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
    return { label: "En curso", className: "border-primary/30 bg-primary/10 text-primary" }
  }
  if (estado === "EXPIRADA_SIN_ACEPTACION")
    return { label: "Sin piloto disponible", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
  if (estado === "BUSCANDO_CONDUCTOR")
    return { label: "Sin piloto", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
  return { label: estado, className: "border-border bg-muted/40 text-muted-foreground" }
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const pasajero = await requirePasajeroActivo()
  const { q = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const skip = (pageNum - 1) * LIMIT

  const where: Prisma.SolicitudDeViajeWhereInput = {
    pasajeroId: pasajero.id,
    OR: [
      { estado: "CANCELADA_POR_PASAJERO" },
      { estado: "EXPIRADA_SIN_ACEPTACION" },
      {
        estado: "ACEPTADA",
        viaje: {
          is: {
            estadoActual: { in: ["FINALIZADO", "CANCELADO_POR_CONDUCTOR"] },
          },
        },
      },
    ],
    ...(q && {
      AND: [
        {
          OR: [
            { origenDireccion: { contains: q, mode: "insensitive" } },
            { destinoDireccion: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    }),
  }

  const [solicitudes, total] = await Promise.all([
    prisma.solicitudDeViaje.findMany({
      where,
      skip,
      take: LIMIT,
      orderBy: { creadaEn: "desc" },
      include: { viaje: { select: { estadoActual: true } } },
    }),
    prisma.solicitudDeViaje.count({ where }),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(p))
    return `/historial?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-background stars-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />

        <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
          <div className="mb-6 border-b border-border/50 pb-4">
            <p
              className="text-xs text-accent/70 tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              MIS MISIONES
            </p>
            <h1
              className="mt-1 text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              ARCHIVO DE MISIONES
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total} misión{total !== 1 ? "es" : ""} registrada{total !== 1 ? "s" : ""}
              {q && (
                <>
                  {" "}que coinciden con{" "}
                  <span className="text-foreground">&ldquo;{q}&rdquo;</span>
                </>
              )}
            </p>
          </div>

          <div className="mb-6">
            <Suspense>
              <HistorialFilters initialQ={q} />
            </Suspense>
          </div>

          {solicitudes.length === 0 ? (
            <div className="holo-border rounded-xl px-6 py-20 text-center space-y-4 relative overflow-hidden scan-lines">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/40 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/40 rounded-br-xl" />

              <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center glow-accent">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-muted-foreground">
                {q
                  ? `No se encontraron misiones con "${q}".`
                  : "No hay misiones registradas aún."}
              </p>
              {!q && (
                <Link
                  href="/inicio"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-glow-red text-white text-sm font-semibold glow-red transition hover:brightness-110"
                  style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
                >
                  INICIAR PRIMERA MISIÓN
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {solicitudes.map((s) => {
                  const viajeEstado = s.viaje?.estadoActual ?? null
                  const badge = getEstadoBadge(s.estado, viajeEstado)
                  return (
                    <div
                      key={s.id}
                      className="holo-border rounded-xl p-5 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-glow-red/30 rounded-tl-xl" />

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground/60">
                              {s.id.slice(0, 8)}…
                            </span>
                          </div>
                          <div className="grid gap-1 text-sm sm:grid-cols-2">
                            <div>
                              <span
                                className="text-xs text-muted-foreground/60 tracking-widest"
                                style={{ fontFamily: "var(--font-orbitron)" }}
                              >
                                ORIGEN ·{" "}
                              </span>
                              <span className="text-foreground">
                                {s.origenDireccion ?? `${s.origenLat.toFixed(5)}, ${s.origenLng.toFixed(5)}`}
                              </span>
                            </div>
                            <div>
                              <span
                                className="text-xs text-muted-foreground/60 tracking-widest"
                                style={{ fontFamily: "var(--font-orbitron)" }}
                              >
                                DESTINO ·{" "}
                              </span>
                              <span className="text-foreground">
                                {s.destinoDireccion ??
                                  (s.destinoLat != null
                                    ? `${s.destinoLat.toFixed(5)}, ${s.destinoLng?.toFixed(5)}`
                                    : "No especificado")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="shrink-0 text-xs text-muted-foreground" suppressHydrationWarning>
                          {new Date(s.creadaEn).toLocaleString("es-AR")}
                        </p>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Link
                          href={`/historial/${s.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-4 text-xs font-medium text-primary transition hover:border-primary/40 hover:bg-primary/10"
                          style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
                        >
                          VER DETALLE
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Paginación del historial"
                  className="mt-8 flex items-center justify-between border-t border-border/50 pt-6"
                >
                  <p className="text-sm text-muted-foreground">
                    Página <span className="text-foreground">{pageNum}</span> de{" "}
                    <span className="text-foreground">{totalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    {pageNum > 1 ? (
                      <Link
                        href={pageUrl(pageNum - 1)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-4 text-sm text-primary transition hover:border-primary/40 hover:bg-primary/10"
                      >
                        ← Anterior
                      </Link>
                    ) : (
                      <span className="inline-flex h-10 items-center justify-center rounded-xl border border-border/30 px-4 text-sm text-muted-foreground/40 cursor-not-allowed">
                        ← Anterior
                      </span>
                    )}
                    {pageNum < totalPages ? (
                      <Link
                        href={pageUrl(pageNum + 1)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-4 text-sm text-primary transition hover:border-primary/40 hover:bg-primary/10"
                      >
                        Siguiente →
                      </Link>
                    ) : (
                      <span className="inline-flex h-10 items-center justify-center rounded-xl border border-border/30 px-4 text-sm text-muted-foreground/40 cursor-not-allowed">
                        Siguiente →
                      </span>
                    )}
                  </div>
                </nav>
              )}
            </>
          )}

          <div className="mt-8 flex justify-center">
            <Link
              href="/inicio"
              className="inline-flex h-12 items-center justify-center rounded-full bg-glow-red text-white px-8 text-sm font-semibold glow-red transition hover:brightness-110"
              style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
            >
              NUEVA MISIÓN
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
