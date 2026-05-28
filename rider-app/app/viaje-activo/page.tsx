import Link from "next/link"
import { getActiveSolicitudByClerkId, getRecentlyFinishedSolicitudByClerkId } from "@/lib/activeSolicitud"
import ViajeActivoCliente from "./ViajeActivoCliente"
import { AppHeader } from "../components/AppHeader"
import { requirePasajeroActivo } from "@/lib/requirePasajeroActivo"

export default async function ViajeActivoPage() {
  const pasajero = await requirePasajeroActivo()

  const solicitud =
    (await getActiveSolicitudByClerkId(pasajero.clerkId)) ??
    (await getRecentlyFinishedSolicitudByClerkId(pasajero.clerkId))

  if (!solicitud) {
    return (
      <div className="min-h-screen bg-background stars-bg relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader />

          <main className="flex-1 flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-md holo-border rounded-xl p-8 text-center space-y-4 relative overflow-hidden scan-lines">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-glow-cyan/50 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-glow-cyan/50 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-glow-cyan/50 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-glow-cyan/50 rounded-br-xl" />

              <div className="w-16 h-16 mx-auto rounded-full bg-glow-cyan/20 flex items-center justify-center"
                style={{ boxShadow: "0 0 20px oklch(0.75 0.15 200 / 0.4), 0 0 40px oklch(0.75 0.15 200 / 0.2)" }}>
                <span className="text-2xl text-glow-cyan">i</span>
              </div>

              <h1
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                SIN VIAJE ACTIVO
              </h1>
              <p className="text-sm text-muted-foreground">
                Cuando quieras, podés pedir uno nuevo desde acá.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/pedir-viaje"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-glow-red text-white text-sm font-semibold glow-red transition hover:brightness-110"
                  style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
                >
                  PEDIR VIAJE
                </Link>
                <Link
                  href="/inicio"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-primary/30 text-primary text-sm font-medium transition hover:bg-primary/10"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <ViajeActivoCliente
      solicitudId={solicitud.id}
      estado={solicitud.estado}
      origen={{ lat: solicitud.origenLat, lng: solicitud.origenLng }}
      origenDireccion={solicitud.origenDireccion ?? null}
      destino={
        solicitud.destinoLat != null && solicitud.destinoLng != null
          ? { lat: solicitud.destinoLat, lng: solicitud.destinoLng }
          : null
      }
      destinoDireccion={solicitud.destinoDireccion ?? null}
      viajeEstado={solicitud.viaje?.estadoActual ?? null}
      viajeId={solicitud.viaje?.id ?? null}
      idConductor={solicitud.viaje?.idConductor ?? null}
      creadaEn={solicitud.creadaEn.toISOString()}
      nombrePasajero={pasajero.nombre}
    />
  )
}
