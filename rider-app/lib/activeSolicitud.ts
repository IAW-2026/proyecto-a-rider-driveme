import { EstadoSolicitud, EstadoViaje } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const SOLICITUDES_ACTIVAS: EstadoSolicitud[] = ["PENDIENTE_PAGO", "BUSCANDO_CONDUCTOR", "ACEPTADA"]
const VIAJES_TERMINADOS: EstadoViaje[] = ["FINALIZADO", "CANCELADO_POR_CONDUCTOR"]
const EXPIRY_MS = 2 * 60 * 1000 // 2 minutos
const PP_EXPIRY_MS = 15 * 60 * 1000 // 15 minutos para pagos abandonados

function solicitudSigueActiva(solicitud: { viaje: { estadoActual: EstadoViaje } | null }) {
  return !solicitud.viaje || !VIAJES_TERMINADOS.includes(solicitud.viaje.estadoActual)
}

async function expireOldSolicitudesByPasajeroId(pasajeroId: string) {
  const cutoff = new Date(Date.now() - EXPIRY_MS)
  const ppCutoff = new Date(Date.now() - PP_EXPIRY_MS)
  await prisma.$transaction([
    prisma.solicitudDeViaje.updateMany({
      where: { pasajeroId, estado: "BUSCANDO_CONDUCTOR", buscandoConductorDesde: { lt: cutoff } },
      data: { estado: "EXPIRADA_SIN_ACEPTACION" },
    }),
    prisma.solicitudDeViaje.updateMany({
      where: { pasajeroId, estado: "BUSCANDO_CONDUCTOR", buscandoConductorDesde: null, creadaEn: { lt: cutoff } },
      data: { estado: "EXPIRADA_SIN_ACEPTACION" },
    }),
    prisma.solicitudDeViaje.updateMany({
      where: { pasajeroId, estado: "PENDIENTE_PAGO", creadaEn: { lt: ppCutoff } },
      data: { estado: "PAGO_RECHAZADO" },
    }),
  ])
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

  const since = new Date(Date.now() - 1 * 60 * 1000) // 1 minuto en vez de 5

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
