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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400/70">
              Panel admin
            </span>
            <Link
              href="/admin/pasajeros"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Pasajeros
            </Link>
            <Link
              href="/admin/solicitudes"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Solicitudes
            </Link>
            <Link
              href="/admin/viajes"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Viajes
            </Link>
          </div>
          <Link
            href="/inicio"
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            Volver a la app
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  )
}
