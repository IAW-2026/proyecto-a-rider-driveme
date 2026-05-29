"use client"

import { useUser } from "@clerk/nextjs"
import dynamic from "next/dynamic"
import { Rocket, Clock, Navigation, Home, Shield, UserCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const UserButton = dynamic(
  () => import("@clerk/nextjs").then((m) => ({ default: m.UserButton })),
  { ssr: false, loading: () => <div className="h-8 w-8 rounded-full bg-muted/20" /> }
)

const navItems = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/pedir-viaje", label: "Pedir Viaje", icon: Rocket },
  { href: "/viaje-activo", label: "Activo", icon: Navigation },
  { href: "/historial", label: "Historial", icon: Clock },
  { href: "/perfil", label: "Perfil", icon: UserCircle },
]

export function AppHeader() {
  const pathname = usePathname()
  const { user } = useUser()
  const firstName =
    user?.firstName ??
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ??
    "Piloto"
  const isAdmin = (user?.publicMetadata?.role as string) === "admin"

  return (
    <header className="sticky top-0 z-50 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link href="/inicio" className="flex items-center gap-3 shrink-0" aria-label="DriveMe — Ir al inicio">
          <div className="w-9 h-9 rounded-full bg-glow-red/20 flex items-center justify-center glow-red">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-glow-red"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground leading-none">Bienvenido de vuelta</p>
            <h1
              className="text-sm font-bold text-glow-red glow-text-red tracking-wider"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {firstName.toUpperCase()}
            </h1>
          </div>
        </Link>

        <nav className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs tracking-wide px-2 sm:px-3 py-2 rounded-lg transition-colors relative",
                  isActive
                    ? "text-glow-red bg-glow-red/10"
                    : "text-muted-foreground hover:text-glow-red hover:bg-glow-red/10"
                )}
                style={isActive ? { fontFamily: "var(--font-orbitron)" } : undefined}
              >
                <item.icon aria-hidden="true" className={cn("w-4 h-4", isActive && "drop-shadow-[0_0_6px_currentColor]")} />
                <span className="hidden xs:inline sm:inline">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-glow-red sm:hidden" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link
              href="/admin/solicitudes"
              aria-label="Panel de administración"
              className="flex items-center gap-1.5 text-[10px] tracking-wide px-2.5 py-1.5 rounded-lg border border-glow-red/30 text-glow-red/70 hover:text-glow-red hover:bg-glow-red/10 transition-colors"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <Shield aria-hidden="true" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ADMIN</span>
            </Link>
          )}
          <UserButton />
        </div>
      </div>
    </header>
  )
}
