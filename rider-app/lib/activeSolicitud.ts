import { EstadoSolicitud, EstadoViaje } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const SOLICITUDES_ACTIVAS: EstadoSolicitud[] = ["BUSCANDO_CONDUCTOR", "ACEPTADA"]
const VIAJES_TERMINADOS: EstadoViaje[] = ["FINALIZADO", "CANCELADO_POR_CONDUCTOR"]
const EXPIRY_MS = 2 * 60 * 1000 // 2 minutos

function solicitudSigueActiva(solicitud: { viaje: { estadoActual: EstadoViaje } | null }) {
  return !solicitud.viaje || !VIAJES_TERMINADOS.includes(solicitud.viaje.estadoActual)
}

async function expireOldSolicitudesByPasajeroId(pasajeroId: string) {
  await prisma.solicitudDeViaje.updateMany({
    where: {
      pasajeroId,
      estado: "BUSCANDO_CONDUCTOR",
      creadaEn: { lt: new Date(Date.now() - EXPIRY_MS) },
    },
    data: { estado: "EXPIRADA_SIN_ACEPTACION" },
  })
}

export async function getActiveSolicitudByPasajeroId(pasajeroId: string) {
  await expireOldSolicitudesByPasajeroId(pasajeroId)

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

// Returns the most recent solicitud whose viaje is FINALIZADO, within the last 2 hours,
// so the rider can still leave feedback after the trip ends.
export async function getRecentlyFinishedSolicitudByClerkId(clerkId: string) {
  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!pasajero) return null

  const since = new Date(Date.now() - 2 * 60 * 60 * 1000)

  return prisma.solicitudDeViaje.findFirst({
    where: {
      pasajeroId: pasajero.id,
      estado: { in: SOLICITUDES_ACTIVAS },
      viaje: { estadoActual: { in: ["FINALIZADO", "CANCELADO_POR_CONDUCTOR"] } },
      creadaEn: { gte: since },
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
}
