"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-xl border border-zinc-800 bg-black/40 text-sm text-zinc-500">
      Cargando mapa…
    </div>
  ),
})

interface Props {
  solicitudId: string
  estado: string
  origen: { lat: number; lng: number }
  destino: { lat: number; lng: number } | null
  viajeEstado: string | null
  idConductor: string | null
  creadaEn: string
}

const ESTADO_LABEL: Record<string, string> = {
  BUSCANDO_CONDUCTOR: "Buscando conductor…",
  ACEPTADA: "Conductor asignado",
  ACEPTADO: "Conductor confirmado",
  EN_CURSO: "Viaje en curso",
}

export default function ViajeActivoCliente({
  solicitudId,
  estado,
  origen,
  destino,
  viajeEstado,
  idConductor,
  creadaEn,
}: Props) {
  const router = useRouter()
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esBuscando = estado === "BUSCANDO_CONDUCTOR"
  const estadoMostrado = viajeEstado ? (ESTADO_LABEL[viajeEstado] ?? viajeEstado) : (ESTADO_LABEL[estado] ?? estado)

  async function cancelar() {
    setCancelando(true)
    setError(null)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CANCELADA_POR_PASAJERO" }),
      })
      if (res.ok) {
        router.push("/inicio")
      } else {
        const data = await res.json()
        setError(data.error ?? "No se pudo cancelar la solicitud.")
        setCancelando(false)
      }
    } catch {
      setError("Error de conexión.")
      setCancelando(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,180,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_15%_80%,rgba(255,0,0,0.14),transparent)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Viaje activo</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{estadoMostrado}</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Solicitud creada el {new Date(creadaEn).toLocaleString("es-AR")}
            </p>
          </div>

          <Link
            href="/inicio"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-white/10"
          >
            Volver al inicio
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    esBuscando
                      ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      : "border border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
                  }`}
                >
                  {estadoMostrado}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Origen</p>
                  <p className="mt-2 text-sm font-medium text-zinc-200">
                    {origen.lat.toFixed(5)}, {origen.lng.toFixed(5)}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Destino</p>
                  <p className="mt-2 text-sm font-medium text-zinc-200">
                    {destino
                      ? `${destino.lat.toFixed(5)}, ${destino.lng.toFixed(5)}`
                      : "No especificado"}
                  </p>
                </div>
              </div>

              {idConductor && (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">ID conductor</p>
                  <p className="mt-2 font-mono text-sm text-zinc-300">{idConductor}</p>
                </div>
              )}

              {esBuscando && (
                <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-950/30 p-4">
                  <p className="text-sm text-yellow-200/80">
                    Tu solicitud está publicada. Un conductor la aceptará en breve.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 sm:p-8">
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">Mapa</p>
              <Map origen={origen} destino={destino} />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Acciones</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/pedir-viaje"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-6 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-white/10"
                >
                  Pedir otro viaje
                </Link>

                {esBuscando && (
                  <button
                    type="button"
                    onClick={cancelar}
                    disabled={cancelando}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-6 text-sm font-medium text-red-200 transition hover:border-red-400/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelando ? "Cancelando…" : "Cancelar solicitud"}
                  </button>
                )}
              </div>

              {error && (
                <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-cyan-950/40 to-black/60 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Info</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {esBuscando
                  ? "Podés cancelar mientras no haya un conductor aceptado."
                  : "El conductor ya aceptó tu solicitud. Solo él puede cancelar en este punto."}
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
