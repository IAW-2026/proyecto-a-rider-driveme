"use client"

import { useState, useEffect } from "react"
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
  origenDireccion: string | null
  destino: { lat: number; lng: number } | null
  destinoDireccion: string | null
  viajeEstado: string | null
  idConductor: string | null
  creadaEn: string
  nombrePasajero: string
}

const ESTADO_LABEL: Record<string, string> = {
  BUSCANDO_CONDUCTOR: "Buscando conductor…",
  ACEPTADA: "Conductor asignado",
  ACEPTADO: "Conductor confirmado",
  EN_CURSO: "Viaje en curso",
  FINALIZADO: "Viaje finalizado",
  CANCELADO_POR_CONDUCTOR: "Cancelado por el conductor",
}

export default function ViajeActivoCliente({
  solicitudId,
  estado,
  origen,
  origenDireccion,
  destino,
  destinoDireccion,
  viajeEstado,
  idConductor,
  creadaEn,
  nombrePasajero,
}: Props) {
  const router = useRouter()
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [driver, setDriver] = useState<any | null>(null)
  const [loadingDriver, setLoadingDriver] = useState(false)

  const esBuscando = estado === "BUSCANDO_CONDUCTOR"
  const estadoMostrado = viajeEstado ? (ESTADO_LABEL[viajeEstado] ?? viajeEstado) : (ESTADO_LABEL[estado] ?? estado)

  useEffect(() => {
    let mounted = true
    async function loadDriver() {
      if (!idConductor) return
      setLoadingDriver(true)
      try {
        const res = await fetch(`/api/conductores/${idConductor}`)
        if (!res.ok) return
        const d = await res.json()
        if (mounted) setDriver(d)
      } catch {}
      setLoadingDriver(false)
    }
    loadDriver()
    return () => { mounted = false }
  }, [idConductor])

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

  if (viajeEstado === "FINALIZADO" || viajeEstado === "CANCELADO_POR_CONDUCTOR") {
    const esCancelado = viajeEstado === "CANCELADO_POR_CONDUCTOR"
    return (
      <main className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,180,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_15%_80%,rgba(255,0,0,0.14),transparent)]" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            <span className={`text-4xl ${esCancelado ? "text-red-400" : "text-cyan-400"}`}>
              {esCancelado ? "✕" : "✓"}
            </span>
            <h1 className="mt-4 text-2xl font-bold">
              {esCancelado ? "Viaje cancelado" : "Viaje finalizado"}
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              {esCancelado
                ? "El conductor canceló el viaje. Podés pedir uno nuevo cuando quieras."
                : "Tu viaje llegó a destino. ¡Gracias por usar DriveMe!"}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {!esCancelado && (
                <Link
                  href={`/historial/${solicitudId}`}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-6 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Dejar feedback
                </Link>
              )}
              <Link
                href="/pedir-viaje"
                className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-red-700 via-red-600 to-orange-600 px-6 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Pedir nuevo viaje
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,180,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_15%_80%,rgba(255,0,0,0.14),transparent)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Viaje activo · {nombrePasajero}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{estadoMostrado}</h1>
            <p className="mt-2 text-sm text-zinc-400" suppressHydrationWarning>
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
                    {origenDireccion ?? `${origen.lat.toFixed(5)}, ${origen.lng.toFixed(5)}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Destino</p>
                  <p className="mt-2 text-sm font-medium text-zinc-200">
                    {destinoDireccion ?? (destino ? `${destino.lat.toFixed(5)}, ${destino.lng.toFixed(5)}` : "No especificado")}
                  </p>
                </div>
              </div>

              {idConductor && (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Conductor</p>
                  {loadingDriver ? (
                    <div className="mt-2 text-sm text-zinc-500">Cargando datos del conductor…</div>
                  ) : driver ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{driver.nombre}</p>
                        <p className="text-xs text-zinc-400">Patente: {driver.patente}</p>
                        <p className="text-xs text-zinc-400">Calificación: {driver.calificacionPromedio ?? "—"}</p>
                      </div>
                      <div className="ml-auto text-sm text-zinc-400">Llega en ~{driver.etaLlegadaMinutos} min</div>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-zinc-500">Información no disponible</div>
                  )}
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
