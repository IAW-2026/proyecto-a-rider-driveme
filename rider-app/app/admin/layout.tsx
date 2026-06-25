import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  const role = user?.publicMetadata?.role as string | undefined

  // Allow local development override: set ALLOW_DEV_ADMIN=1 in .env.local
  const allowDev = process.env.ALLOW_DEV_ADMIN === "1"
  if (role !== "admin" && !allowDev) redirect("/inicio")

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400 shrink-0">
              Panel admin
            </span>
            <Link
              href="/admin/pasajeros"
              className="text-xs sm:text-sm text-zinc-400 transition hover:text-white shrink-0 whitespace-nowrap"
            >
              Pasajeros
            </Link>
            <Link
              href="/admin/solicitudes"
              className="text-xs sm:text-sm text-zinc-400 transition hover:text-white shrink-0 whitespace-nowrap"
            >
              Solicitudes
            </Link>
            <Link
              href="/admin/viajes"
              className="text-xs sm:text-sm text-zinc-400 transition hover:text-white shrink-0 whitespace-nowrap"
            >
              Viajes
            </Link>
          </div>
          <Link
            href="/inicio"
            className="text-xs sm:text-sm text-zinc-400 transition hover:text-zinc-300 shrink-0 whitespace-nowrap"
          >
            <span className="sm:hidden">← App</span>
            <span className="hidden sm:inline">Volver a la app</span>
          </Link>
        </div>
      </nav>
      <main className="px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  )
}
