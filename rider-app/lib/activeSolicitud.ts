import { EstadoSolicitud, EstadoViaje } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const SOLICITUDES_ACTIVAS: EstadoSolicitud[] = ["BUSCANDO_CONDUCTOR", "ACEPTADA"]
const VIAJES_TERMINADOS: EstadoViaje[] = ["FINALIZADO", "CANCELADO_POR_CONDUCTOR"]

function solicitudSigueActiva(solicitud: { viaje: { estadoActual: EstadoViaje } | null }) {
  return !solicitud.viaje || !VIAJES_TERMINADOS.includes(solicitud.viaje.estadoActual)
}

export async function getActiveSolicitudByPasajeroId(pasajeroId: string) {
  const solicitud = await prisma.solicitudDeViaje.findFirst({
    where: {
      pasajeroId,
      estado: { in: SOLICITUDES_ACTIVAS },
    },
    include: {
      viaje: {
        select: {
          id: true,
          estadoActual: true,
          idConductor: true,
        },
      },
    },
    orderBy: { creadaEn: "desc" },
  })

  if (!solicitud || !solicitudSigueActiva(solicitud)) return null
  return solicitud
}

export async function getActiveSolicitudByClerkId(clerkId: string) {
  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId },
    select: { id: true },
  })

  if (!pasajero) return null
  return getActiveSolicitudByPasajeroId(pasajero.id)
}
