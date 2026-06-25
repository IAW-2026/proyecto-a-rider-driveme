import Link from "next/link"
import { ShieldX, RefreshCw, MessageSquare } from "lucide-react"
import { SignOutBtn } from "./SignOutBtn"

export default function CuentaBloqueadaPage() {
  const feedbackUrl = process.env.FEEDBACK_APP_URL ?? "#"

  return (
    <div className="min-h-screen bg-background stars-bg relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="holo-border rounded-2xl p-8 text-center space-y-6 relative overflow-hidden scan-lines">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-red/50 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-red/50 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-red/50 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-red/50 rounded-br-2xl" />

          <div className="w-20 h-20 mx-auto rounded-full bg-glow-red/20 flex items-center justify-center glow-red">
            <ShieldX className="w-10 h-10 text-glow-red" />
          </div>

          <div className="space-y-2">
            <p
              className="text-xs text-glow-red/70 tracking-widest"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              ACCESO DENEGADO
            </p>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              CUENTA SUSPENDIDA
            </h1>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Tu cuenta fue suspendida temporalmente por un administrador de DriveMe.
            Si creés que es un error, contactá a soporte.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/inicio"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-primary/30 text-primary text-sm font-medium transition hover:bg-primary/10"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </Link>

            <a
              href={feedbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-glow-red text-white text-sm font-semibold glow-red transition hover:brightness-110"
              style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
            >
              <MessageSquare className="w-4 h-4" />
              CONTACTAR SOPORTE
            </a>

            <SignOutBtn />
          </div>
        </div>
      </div>
    </div>
  )
}
