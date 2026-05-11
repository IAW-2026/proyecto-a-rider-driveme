import Link from 'next/link';

export default function PedirViajePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,0,0,0.22),transparent),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(120,0,255,0.12),transparent)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-red-400/70">Pedido de viaje</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Pedir viaje</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Página base para solicitar un viaje. Está pensada para que al menos exista y después se pueda conectar con la lógica real.
            </p>
          </div>

          <Link
            href="/inicio"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-red-400/60 hover:bg-red-500/10"
          >
            Volver al inicio
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/90 to-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] sm:p-8">
            <h2 className="text-xl font-semibold">Formulario rápido</h2>
            <p className="mt-2 text-sm text-zinc-400">Completa los datos mínimos para dejar lista la pantalla.</p>

            <form className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">Origen</label>
                <input
                  type="text"
                  placeholder="Dónde te recogemos"
                  className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">Destino</label>
                <input
                  type="text"
                  placeholder="A dónde querés ir"
                  className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">Hora estimada</label>
                  <input
                    type="time"
                    className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">Pasajeros</label>
                  <input
                    type="number"
                    min="1"
                    defaultValue={1}
                    className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">Comentarios</label>
                <textarea
                  rows={4}
                  placeholder="Piso, referencias, equipaje, etc."
                  className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-red-700 via-red-600 to-orange-600 px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgba(220,38,38,0.25)] transition hover:scale-[1.01]"
                >
                  Solicitar viaje
                </button>
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-6 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-white/10"
                >
                  Guardar borrador
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Estado</p>
              <h3 className="mt-3 text-lg font-semibold">Listo para enviar</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Esta pantalla todavía no conecta con la API, pero ya sirve como base visual y de navegación.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-red-950/40 to-black/60 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-red-300/70">Atajos</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p>• Reusar este formulario para el flujo real de pasajeros.</p>
                <p>• Conectar el botón con la ruta de solicitudes.</p>
                <p>• Mostrar la confirmación en una tarjeta aparte.</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}