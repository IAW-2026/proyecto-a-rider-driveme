import { redirect } from "next/navigation"
import { Mail, Star } from "lucide-react"
import { AppHeader } from "@/app/components/AppHeader"
import { prisma } from "@/lib/prisma"
import { requirePasajeroActivo } from "@/lib/requirePasajeroActivo"
import PerfilForm from "./PerfilForm"
import DireccionesManager from "./DireccionesManager"

export default async function PerfilPage() {
  const { clerkId: userId } = await requirePasajeroActivo()

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      ratingPromedio: true,
      comentarioPromedio: true,
      direcciones: {
        orderBy: { createdAt: "asc" },
        select: { id: true, nombre: true, direccion: true, latitud: true, longitud: true },
      },
    },
  })

  if (!pasajero) redirect("/sign-in")

  const rating = Number(pasajero.ratingPromedio)

  return (
    <div className="min-h-screen bg-background stars-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />

        <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full space-y-6">
          <div>
            <h1
              className="text-lg font-bold text-foreground tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              MI PERFIL
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Administrá tu cuenta y tus preferencias</p>
          </div>

          {/* Rating card */}
          <div className="holo-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-glow-red/20 flex items-center justify-center glow-red shrink-0">
              <span className="text-2xl font-bold text-glow-red" style={{ fontFamily: "var(--font-orbitron)" }}>
                {pasajero.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{pasajero.nombre}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{pasajero.email}</span>
              </div>
            </div>
            <div className="shrink-0 text-center">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold text-foreground">{rating > 0 ? rating.toFixed(1) : "—"}</span>
              </div>
              <p className="text-[10px] text-muted-foreground tracking-widest">RATING PROMEDIO</p>
            </div>
          </div>

          {/* Editar datos personales */}
          <PerfilForm nombre={pasajero.nombre} telefono={pasajero.telefono} />

          {/* Direcciones frecuentes */}
          <DireccionesManager inicial={pasajero.direcciones} />

          {/* Métodos de pago — mockeado */}
          <div className="holo-border rounded-2xl p-6 space-y-3 opacity-60">
            <h2
              className="text-sm font-bold text-foreground tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              MÉTODOS DE PAGO
            </h2>
            <p className="text-xs text-muted-foreground">
              Integración con Payments App disponible en Etapa 3.
            </p>
            <div className="rounded-xl border border-dashed border-primary/20 px-4 py-3 text-xs text-muted-foreground/60">
              • Efectivo (disponible siempre)
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
