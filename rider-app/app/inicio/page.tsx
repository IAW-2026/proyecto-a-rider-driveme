import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { AppHeader } from "../components/AppHeader"
import GalaxyCard from "../components/GalaxyCard"
import QuickTripForm from "./QuickTripForm"
import SavedPlaces from "./SavedPlaces"
import { getActiveSolicitudByClerkId } from "@/lib/activeSolicitud"
import { requirePasajeroActivo } from "@/lib/requirePasajeroActivo"
import { prisma } from "@/lib/prisma"

const galaxies = [
  { name: "Andrómeda", visits: 128, emoji: "🌌", description: "La más distante", color: "from-primary/20 to-glow-magenta/10" },
  { name: "Tatooine", visits: 94, emoji: "🏜️", description: "Planeta del desierto", color: "from-glow-red/20 to-accent/10" },
  { name: "Kessel", visits: 72, emoji: "💎", description: "Minas de spice", color: "from-glow-cyan/20 to-primary/10" },
  { name: "Hoth", visits: 68, emoji: "❄️", description: "Planeta de hielo", color: "from-primary/20 to-glow-magenta/10" },
]

export default async function InicioPage() {
  const pasajero = await requirePasajeroActivo()

  const [solicitudActiva, direcciones] = await Promise.all([
    getActiveSolicitudByClerkId(pasajero.clerkId),
    prisma.direccionFrecuente.findMany({
      where: { pasajeroId: pasajero.id },
      orderBy: { nombre: "asc" },
    }),
  ])

  return (
    <div className="min-h-screen bg-background stars-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader defaultName={pasajero.nombre.split(" ")[0]} />

        <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column */}
            <div className="flex-1 space-y-4">
              {solicitudActiva ? (
                <div className="holo-border rounded-xl p-8 text-center space-y-4 relative overflow-hidden scan-lines">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

                  <div className="w-16 h-16 mx-auto rounded-full bg-glow-red/20 flex items-center justify-center glow-red">
                    <span className="text-2xl">!</span>
                  </div>
                  <h2
                    className="text-xl font-bold text-foreground"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    YA TENÉS UN VIAJE ACTIVO
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    No podés pedir otro viaje hasta finalizar o cancelar el actual.
                  </p>
                  <Link
                    href="/viaje-activo"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-glow-red text-white text-sm font-semibold glow-red transition hover:brightness-110 px-6"
                    style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
                  >
                    VER VIAJE ACTIVO
                  </Link>
                </div>
              ) : (
                <>
                  <QuickTripForm tieneMercadoPago={pasajero.tieneMercadoPago} />
                  <SavedPlaces lugares={direcciones} />
                </>
              )}
            </div>

            {/* Right Column */}
            <div className="lg:w-80 xl:w-96 space-y-6">
              
              {/* Cómo Funciona */}
              <div className="holo-border rounded-xl p-5 space-y-3 relative overflow-hidden scan-lines">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-xl" />

                <p
                  className="text-xs text-primary/80 tracking-widest flex items-center gap-2"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  ¿CÓMO FUNCIONA?
                </p>
                <div className="space-y-2 text-xs text-muted-foreground/80">
                  <p>1. Ingresás tus coordenadas de origen y destino en el navicomputador.</p>
                  <p>2. Transmitimos la señal a la red de transporte intergaláctica.</p>
                  <p>3. Un piloto de la Alianza acepta la misión y traza rumbo a tu sector.</p>
                  <p>4. Rastreamos la nave en tiempo real por el holored.</p>
                </div>
              </div>

              {/* Galaxias más visitadas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <h3
                    className="text-xs text-primary/80 tracking-widest"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    PLANETAS MÁS VISITADOS
                  </h3>
                </div>

              <div className="grid grid-cols-2 gap-3">
                {galaxies.map((galaxy, index) => (
                  <GalaxyCard
                    key={galaxy.name}
                    name={galaxy.name}
                    visits={galaxy.visits}
                    emoji={galaxy.emoji}
                    description={galaxy.description}
                    color={galaxy.color}
                    rank={index + 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}
