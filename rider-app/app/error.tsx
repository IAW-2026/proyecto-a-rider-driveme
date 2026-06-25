"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(255,0,0,0.12),transparent)]" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-red-400/70">Error inesperado</p>
        <h1 className="text-4xl font-bold sm:text-5xl">Algo salió mal</h1>
        <p className="max-w-md text-sm text-zinc-400">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-red-700 via-red-600 to-orange-600 px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgba(220,38,38,0.25)] transition hover:scale-[1.01]"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/inicio"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-6 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-white/10"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
