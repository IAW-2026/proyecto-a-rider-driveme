import Link from 'next/link';

export default function ViajeActivoPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,180,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_15%_80%,rgba(255,0,0,0.14),transparent)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Viaje en curso</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Ver viaje activo</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Vista base para mostrar un viaje activo. La idea es que después reciba los datos reales desde la API.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/pedir-viaje"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-cyan-400/60 hover:bg-cyan-500/10"
            >
              Pedir otro viaje
            </Link>
            <Link
              href="/inicio"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-white/10"
            >
              Volver al inicio
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Solicitud #A-024</p>
                <h2 className="mt-2 text-2xl font-semibold">En camino a tu destino</h2>
                <p className="mt-2 text-sm text-zinc-400">Estado actual: conductor asignado, traslado en progreso.</p>
              </div>
              <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
                12 min restantes
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Conductor</p>
                <p className="mt-2 text-lg font-semibold">Martín R.</p>
                <p className="text-sm text-zinc-400">Plata · patente DRV-204 · 4.9 estrellas</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Origen</p>
                  <p className="mt-2 text-sm text-zinc-200">Av. Central 1234</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Destino</p>
                  <p className="mt-2 text-sm text-zinc-200">Campus Norte</p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Seguimiento</p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
                    <p className="text-sm text-zinc-300">Conductor confirmado</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
                    <p className="text-sm text-zinc-300">Vehículo en ruta</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full border border-zinc-600 bg-black" />
                    <p className="text-sm text-zinc-500">Llegada al destino</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Acciones</p>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-700 via-cyan-600 to-blue-600 px-6 text-sm font-semibold text-white transition hover:scale-[1.01]"
                >
                  Contactar conductor
                </button>
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-6 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-white/10"
                >
                  Ver mapa
                </button>
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-6 text-sm font-medium text-red-200 transition hover:border-red-400/60 hover:bg-red-500/20"
                >
                  Cancelar viaje
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-cyan-950/40 to-black/60 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Nota</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Esta vista está hecha a propósito de forma simple para tener algo funcionando. Después se puede reemplazar por los datos que devuelva <span className="text-zinc-200">/api/pasajeros/[id_pasajero]/viajes/activos</span>.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}