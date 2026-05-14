import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { AppHeader } from "../components/AppHeader"

function getEstadoBadge(estado: string, viajeEstado: string | null | undefined) {
  if (estado === "CANCELADA_POR_PASAJERO")
    return { label: "Cancelaste este viaje", className: "border-destructive/30 bg-destructive/10 text-destructive-foreground" }
  if (estado === "ACEPTADA") {
    if (viajeEstado === "FINALIZADO")
      return { label: "Viaje completado", className: "border-accent/30 bg-accent/10 text-accent" }
    if (viajeEstado === "CANCELADO_POR_CONDUCTOR")
      return { label: "El conductor canceló", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
    return { label: "En curso", className: "border-primary/30 bg-primary/10 text-primary" }
  }
  if (estado === "BUSCANDO_CONDUCTOR")
    return { label: "Sin conductor", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" }
  return { label: estado, className: "border-border bg-muted/40 text-muted-foreground" }
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
              MIS VIAJES
            </p>
            <h1
              className="mt-1 text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              HISTORIAL
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {solicitudes.length} viaje{solicitudes.length !== 1 ? "s" : ""} registrado{solicitudes.length !== 1 ? "s" : ""}
            </p>
          </div>

          {solicitudes.length === 0 ? (
            <div className="holo-border rounded-xl px-6 py-20 text-center space-y-4 relative overflow-hidden scan-lines">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/40 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/40 rounded-br-xl" />

              <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center glow-accent">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-muted-foreground">Todavía no tenés viajes finalizados o cancelados.</p>
              <Link
                href="/pedir-viaje"
                className="inline-flex h-11 items-center justify-center rounded-full bg-glow-red text-white text-sm font-semibold glow-red transition hover:brightness-110"
                style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
              >
                PEDIR TU PRIMER VIAJE
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
          )}

          <div className="mt-8 flex justify-center">
            <Link
              href="/pedir-viaje"
              className="inline-flex h-12 items-center justify-center rounded-full bg-glow-red text-white px-8 text-sm font-semibold glow-red transition hover:brightness-110"
              style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
            >
              PEDIR NUEVO VIAJE
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
