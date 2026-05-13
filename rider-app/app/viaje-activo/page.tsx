import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ViajeActivoCliente from "./ViajeActivoCliente"

export default async function ViajeActivoPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: userId },
  })
  if (!pasajero) redirect("/inicio")

  const solicitud = await prisma.solicitudDeViaje.findFirst({
    where: {
      pasajeroId: pasajero.id,
      estado: { in: ["BUSCANDO_CONDUCTOR", "ACEPTADA"] },
    },
    include: { viaje: true },
    orderBy: { creadaEn: "desc" },
  })

  if (!solicitud) redirect("/inicio")

  if (
    solicitud.viaje &&
    ["FINALIZADO", "CANCELADO_POR_CONDUCTOR"].includes(solicitud.viaje.estadoActual)
  ) {
    redirect("/historial")
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
      idConductor={solicitud.viaje?.idConductor ?? null}
      creadaEn={solicitud.creadaEn.toISOString()}
      nombrePasajero={pasajero.nombre}
    />
  )
}
