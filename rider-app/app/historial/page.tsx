import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

function getEstadoBadge(estado: string, viajeEstado: string | null | undefined) {
  if (estado === "CANCELADA_POR_PASAJERO")
    return { label: "Cancelaste este viaje", className: "border-red-500/30 bg-red-500/10 text-red-300" }
  if (estado === "ACEPTADA") {
    if (viajeEstado === "FINALIZADO")
      return { label: "Viaje completado", className: "border-green-500/30 bg-green-500/10 text-green-300" }
    if (viajeEstado === "CANCELADO_POR_CONDUCTOR")
      return { label: "El conductor canceló", className: "border-orange-500/30 bg-orange-500/10 text-orange-300" }
    return { label: "En curso", className: "border-blue-500/30 bg-blue-500/10 text-blue-300" }
  }
  if (estado === "BUSCANDO_CONDUCTOR")
    return { label: "Sin conductor", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
  return { label: estado, className: "border-zinc-600/40 bg-zinc-800/40 text-zinc-400" }
}

export default async function HistorialPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: userId },
  })
  if (!pasajero) redirect("/inicio")

  const solicitudes = await prisma.solicitudDeViaje.findMany({
    where: {
      pasajeroId: pasajero.id,
      OR: [
        { estado: "CANCELADA_POR_PASAJERO" },
        {
          estado: "ACEPTADA",
          viaje: {
            is: {
              estadoActual: { in: ["FINALIZADO", "CANCELADO_POR_CONDUCTOR"] },
            },
          },
        },
      ],
    },
    include: { viaje: { select: { estadoActual: true } } },
    orderBy: { creadaEn: "desc" },
  })

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,180,255,0.12),transparent),radial-gradient(ellipse_60%_50%_at_15%_80%,rgba(255,0,0,0.10),transparent)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Mis viajes</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Historial</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {solicitudes.length} viaje{solicitudes.length !== 1 ? "s" : ""} registrado{solicitudes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/inicio"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-white/10"
          >
            Volver al inicio
          </Link>
        </header>

        {solicitudes.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 px-6 py-20 text-center">
            <p className="text-zinc-500">Todavía no tenés viajes finalizados o cancelados.</p>
            <Link
              href="/pedir-viaje"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-red-700 via-red-600 to-orange-600 px-6 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Pedir tu primer viaje
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map((s) => {
              const viajeEstado = s.viaje?.estadoActual ?? null
              const badge = getEstadoBadge(s.estado, viajeEstado)
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950/80 to-black/60 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="font-mono text-xs text-zinc-600">{s.id.slice(0, 8)}…</span>
                      </div>
                      <div className="grid gap-1 text-sm sm:grid-cols-2">
                        <div>
                          <span className="text-xs uppercase tracking-[0.3em] text-zinc-600">Origen · </span>
                          <span className="text-zinc-300">
                            {s.origenDireccion ?? `${s.origenLat.toFixed(5)}, ${s.origenLng.toFixed(5)}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-[0.3em] text-zinc-600">Destino · </span>
                          <span className="text-zinc-300">
                            {s.destinoDireccion ?? (
                              s.destinoLat != null
                                ? `${s.destinoLat.toFixed(5)}, ${s.destinoLng?.toFixed(5)}`
                                : "No especificado"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="shrink-0 text-xs text-zinc-500" suppressHydrationWarning>
                      {new Date(s.creadaEn).toLocaleString("es-AR")}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/historial/${s.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-4 text-xs font-medium text-white transition hover:border-cyan-500/50 hover:bg-cyan-500/10"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/pedir-viaje"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-red-700 via-red-600 to-orange-600 px-8 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Pedir nuevo viaje
          </Link>
        </div>
      </div>
    </main>
  )
}
