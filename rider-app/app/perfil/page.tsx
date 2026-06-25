import { redirect } from "next/navigation"
import { Star } from "lucide-react"
import { AppHeader } from "@/app/components/AppHeader"
import { prisma } from "@/lib/prisma"
import { requirePasajeroActivo } from "@/lib/requirePasajeroActivo"
import { obtenerCalificacionesUsuario } from "@/lib/feedback"
import { getImperialRank, getRankProgress } from "@/lib/imperialRank"
import PerfilForm from "./PerfilForm"
import DireccionesManager from "./DireccionesManager"
import PaymentMethods from "./PaymentMethods"

export default async function PerfilPage() {
  const { clerkId: userId } = await requirePasajeroActivo()

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      tieneMercadoPago: true,
      ratingPromedio: true,
      comentarioPromedio: true,
      direcciones: {
        orderBy: { createdAt: "asc" },
        select: { id: true, nombre: true, direccion: true, latitud: true, longitud: true },
      },
    },
  })

  if (!pasajero) redirect("/sign-in")

  const [calificaciones, misionesCompletadas] = await Promise.all([
    obtenerCalificacionesUsuario(pasajero.id).catch(() => null),
    prisma.solicitudDeViaje.count({
      where: {
        pasajeroId: pasajero.id,
        estado: "ACEPTADA",
        viaje: { estadoActual: "FINALIZADO" },
      },
    }),
  ])

  const rating = Number(pasajero.ratingPromedio)
  const rank = getImperialRank(misionesCompletadas)
  const rankProgress = getRankProgress(misionesCompletadas, rank)

  return (
    <div className="min-h-screen bg-background stars-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader imperialRank={rank.label} rankTextClass={rank.textClass} />

        <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full space-y-6">
          <div>
            <h1
              className="text-lg font-bold text-foreground tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              MI EXPEDIENTE IMPERIAL
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Registro de agente galáctico</p>
          </div>

          {/* Rank card */}
          <div
            className={`holo-border rounded-2xl p-5 space-y-4 relative overflow-hidden scan-lines border ${rank.borderClass}`}
            style={{ boxShadow: rank.glowStyle || undefined }}
          >
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-current opacity-30 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-current opacity-30 rounded-br-2xl" />

            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-[10px] text-muted-foreground/70 tracking-[0.3em]"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  RANGO IMPERIAL
                </p>
                <p
                  className={`mt-1 text-xl font-bold tracking-wide ${rank.textClass}`}
                  style={{ fontFamily: "var(--font-orbitron)", textShadow: rank.glowStyle ? rank.glowStyle.replace("box-shadow", "") : undefined }}
                >
                  {rank.icon} {rank.label}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground/60 tracking-widest"
                style={{ fontFamily: "var(--font-orbitron)" }}>
                <span>{rank.min} MISIONES</span>
                {rank.max !== null ? (
                  <span>{rank.max + 1} MISIONES</span>
                ) : (
                  <span>RANGO MÁXIMO</span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${rank.bgClass}`}
                  style={{ width: `${rankProgress}%`, boxShadow: rank.glowStyle || undefined }}
                />
              </div>
              {rank.nextLabel && (
                <p className="text-[10px] text-muted-foreground/50 text-right">
                  Siguiente: <span className="text-muted-foreground">{rank.nextLabel}</span>
                </p>
              )}
            </div>
          </div>

          {/* Identidad + Evaluaciones */}
          {(() => {
            const feedbackData = calificaciones && calificaciones.total_calificaciones > 0 ? calificaciones : null
            const fallbackRating = rating > 0 ? rating : null
            return (
              <div className="holo-border rounded-2xl p-5 space-y-4">
                {/* Fila de identidad */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-glow-red/20 flex items-center justify-center glow-red shrink-0">
                    <span className="text-2xl font-bold text-glow-red" style={{ fontFamily: "var(--font-orbitron)" }}>
                      {pasajero.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{pasajero.nombre}</p>
                  </div>
                  <div className="shrink-0 text-center">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-lg font-bold text-foreground">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground tracking-widest">CLASIFICACIÓN</p>
                  </div>
                </div>

                {/* Divisor */}
                <div className="border-t border-border/40" />

                {/* Evaluaciones */}
                <div className="space-y-2">
                  <p
                    className="text-[10px] text-muted-foreground/70 tracking-[0.3em]"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    COMENTARIO PROMEDIO DE PILOTOS
                  </p>
                  {feedbackData ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Promedio recibido</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-foreground">
                            {feedbackData.calificacion_promedio.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total calificaciones</span>
                        <span className="text-sm text-foreground">{feedbackData.total_calificaciones}</span>
                      </div>
                      {pasajero.comentarioPromedio && (
                        <p className="text-xs text-muted-foreground italic border-t border-primary/10 pt-3">
                          &ldquo;{pasajero.comentarioPromedio}&rdquo;
                        </p>
                      )}
                    </div>
                  ) : fallbackRating !== null ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Rating promedio</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-foreground">{fallbackRating.toFixed(1)}</span>
                        </div>
                      </div>
                      {pasajero.comentarioPromedio && (
                        <p className="text-xs text-muted-foreground italic border-t border-primary/10 pt-3">
                          &ldquo;{pasajero.comentarioPromedio}&rdquo;
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">Sin evaluaciones registradas.</p>
                  )}
                </div>

                {/* Divisor */}
                <div className="border-t border-border/40" />

                {/* Datos personales */}
                <PerfilForm nombre={pasajero.nombre} telefono={pasajero.telefono} />
              </div>
            )
          })()}

          {/* Direcciones frecuentes */}
          <DireccionesManager inicial={pasajero.direcciones} />

          {/* Métodos de pago */}
          <PaymentMethods initialTieneMP={pasajero.tieneMercadoPago} />
        </main>
      </div>
    </div>
  )
}
