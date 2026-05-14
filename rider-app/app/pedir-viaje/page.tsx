import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import PedirViajeForm from "./PedirViajeForm"
import { getActiveSolicitudByClerkId } from "@/lib/activeSolicitud"
import { AppHeader } from "../components/AppHeader"

export default async function PedirViajePage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const solicitudActiva = await getActiveSolicitudByClerkId(userId)

  if (!solicitudActiva) {
    return (
      <div className="min-h-screen bg-background stars-bg relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader />
          <Suspense>
            <PedirViajeForm />
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background stars-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />

        <main className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-md holo-border rounded-xl p-8 text-center space-y-4 relative overflow-hidden scan-lines">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-xl" />

            <div className="w-16 h-16 mx-auto rounded-full bg-glow-red/20 flex items-center justify-center glow-red">
              <span className="text-2xl">!</span>
            </div>
            <h1
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              YA TENES UN VIAJE ACTIVO
            </h1>
            <p className="text-sm text-muted-foreground">
              No podés pedir otro viaje hasta finalizar o cancelar el actual.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/viaje-activo"
                className="inline-flex h-12 items-center justify-center rounded-full bg-glow-red text-white text-sm font-semibold glow-red transition hover:brightness-110"
                style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
              >
                VER VIAJE ACTIVO
              </Link>
              <Link
                href="/inicio"
                className="inline-flex h-12 items-center justify-center rounded-full border border-primary/30 text-primary text-sm font-medium transition hover:bg-primary/10"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
