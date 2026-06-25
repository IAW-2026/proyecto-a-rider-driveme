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

/**
 * Si la solicitud está en PENDIENTE_PAGO, consulta la Payments App para ver
 * si el pago fue rechazado/capturado antes de que llegue el webhook.
 * Si resultó rechazado, la marca como PAGO_RECHAZADO en la BD y devuelve null
 * para que el pasajero pueda pedir otro viaje de inmediato.
 */
async function resolverEstadoPago(solicitud: { id: string; estado: EstadoSolicitud; metodoPago: string }) {
  if (solicitud.estado !== "PENDIENTE_PAGO" || solicitud.metodoPago !== "MERCADO_PAGO") {
    return solicitud.estado
  }

  try {
    const { obtenerTransaccionViaje } = await import("@/lib/payments")
    const txInfo = await obtenerTransaccionViaje(solicitud.id)

    if (txInfo && (txInfo.estado === "CAPTURED" || txInfo.estado === "FAILED")) {
      const nuevoEstado = txInfo.estado === "CAPTURED" ? "BUSCANDO_CONDUCTOR" : "PAGO_RECHAZADO"
      await prisma.solicitudDeViaje.updateMany({
        where: { id: solicitud.id, estado: "PENDIENTE_PAGO" },
        data: {
          estado: nuevoEstado,
          ...(nuevoEstado === "BUSCANDO_CONDUCTOR" ? { buscandoConductorDesde: new Date() } : {}),
        },
      })
      return nuevoEstado
    }
  } catch {
    // Payments App no disponible — conservamos PENDIENTE_PAGO
  }

  return "PENDIENTE_PAGO"
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

  // Si está esperando pago, verificar con Payments App si ya fue resuelto
  if (solicitud.estado === "PENDIENTE_PAGO") {
    const estadoReal = await resolverEstadoPago({
      id: solicitud.id,
      estado: solicitud.estado,
      metodoPago: solicitud.metodoPago,
    })
    // Si fue rechazado o capturado (y ya quedó como BUSCANDO_CONDUCTOR),
    // refrescamos desde la BD para devolver el estado actualizado
    if (estadoReal === "PAGO_RECHAZADO") return null
    if (estadoReal === "BUSCANDO_CONDUCTOR") {
      return prisma.solicitudDeViaje.findUnique({
        where: { id: solicitud.id },
        include: { viaje: { select: { id: true, estadoActual: true, idConductor: true } } },
      })
    }
  }

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

  const since = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas (para que el modal sea obligatorio)

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
