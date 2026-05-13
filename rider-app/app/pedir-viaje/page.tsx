import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import PedirViajeForm from "./PedirViajeForm"
import { getActiveSolicitudByClerkId } from "@/lib/activeSolicitud"

export default async function PedirViajePage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const solicitudActiva = await getActiveSolicitudByClerkId(userId)

  if (!solicitudActiva) {
    return <PedirViajeForm />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,0,0,0.22),transparent),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(120,0,255,0.12),transparent)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
          <span className="text-4xl text-yellow-300">!</span>
          <h1 className="mt-4 text-2xl font-bold">Ya tenes un viaje activo</h1>
          <p className="mt-3 text-sm text-zinc-400">
            No podes pedir otro viaje hasta finalizar o cancelar el actual.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/viaje-activo"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-red-700 via-red-600 to-orange-600 px-6 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Ver mi viaje activo
            </Link>
            <Link
              href="/inicio"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-6 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-white/10"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
