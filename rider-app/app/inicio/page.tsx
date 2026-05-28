import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { AppHeader } from "../components/AppHeader"
import GalaxyCard from "../components/GalaxyCard"
import QuickTripForm from "./QuickTripForm"
import SavedPlaces from "./SavedPlaces"
import { getActiveSolicitudByClerkId } from "@/lib/activeSolicitud"
import { requirePasajeroActivo } from "@/lib/requirePasajeroActivo"

const galaxies = [
  { name: "Andrómeda", visits: 128, emoji: "🌌", description: "La más distante", color: "from-primary/20 to-glow-magenta/10" },
  { name: "Tatooine", visits: 94, emoji: "🏜️", description: "Planeta del desierto", color: "from-glow-red/20 to-accent/10" },
  { name: "Kessel", visits: 72, emoji: "💎", description: "Minas de spice", color: "from-glow-cyan/20 to-primary/10" },
  { name: "Hoth", visits: 68, emoji: "❄️", description: "Planeta de hielo", color: "from-primary/20 to-glow-magenta/10" },
  { name: "Dagobah", visits: 55, emoji: "🌫️", description: "El pantano místico", color: "from-accent/20 to-glow-green/10" },
  { name: "Coruscant", visits: 43, emoji: "🏙️", description: "Capital galáctica", color: "from-glow-red/20 to-glow-magenta/10" },
]

export default async function InicioPage() {
  const pasajero = await requirePasajeroActivo()

  const solicitudActiva = await getActiveSolicitudByClerkId(pasajero.clerkId)

  return (
    <div className="min-h-screen bg-background stars-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />

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
                  <QuickTripForm />
                  <SavedPlaces />
                </>
              )}
            </div>

            {/* Right Column - Galaxias más visitadas */}
            <div className="lg:w-80 xl:w-96 space-y-3">
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
        </main>
      </div>
    </div>
  )
}
