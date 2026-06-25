import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"
import { resolvePublicIdToInternalId } from "@/lib/ids"

export async function POST(req: NextRequest) {
  const m2mError = requireM2MToken(req)
  if (m2mError) return m2mError
  
  const body = await req.json()
  const { id_solicitud, id_conductor, id_vehiculo, latitud_actual, longitud_actual, id_pasajero, id_viaje, patente, puntaje_promedio_conductor, comentario_promedio_conductor } = body

  if (!id_solicitud || !id_conductor || !id_vehiculo || latitud_actual === undefined || longitud_actual === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id: id_solicitud },
    include: { pasajero: { select: { id: true, publicId: true } } },
  })

  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  // Si el caller provee id_pasajero, validar que coincida con la solicitud
  if (id_pasajero) {
    let internalId = id_pasajero
    if (typeof id_pasajero === "string" && id_pasajero.startsWith("pas_")) {
      internalId = await resolvePublicIdToInternalId(id_pasajero)
    }
    if (!internalId || solicitud.pasajero.id !== internalId) {
      return NextResponse.json({ error: "id_pasajero no coincide con la solicitud" }, { status: 400 })
    }
  }

  if (solicitud.estado !== "BUSCANDO_CONDUCTOR") {
    return NextResponse.json({ error: "La solicitud no está disponible" }, { status: 409 })
  }

  const [viaje] = await prisma.$transaction([
    prisma.viaje.create({
      data: {
        solicitudId: id_solicitud,
        idViajeDriver: id_viaje ?? null,
        idConductor: id_conductor,
        idVehiculo: id_vehiculo,
        latitudActual: latitud_actual,
        longitudActual: longitud_actual,
        estadoActual: "ACEPTADO",
        patente: patente ?? null,
        puntajePromedioConductor: puntaje_promedio_conductor ?? null,
        comentarioPromedioConductor: comentario_promedio_conductor ?? null,
      },
    }),
    prisma.solicitudDeViaje.update({
      where: { id: id_solicitud },
      data: { estado: "ACEPTADA" },
    }),
  ])

  // Llamar asincronamente a Payments App para notificar la transacción
  import("@/lib/payments").then(({ crearTransaccionViaje }) => {
    crearTransaccionViaje({
      idViaje: viaje.id,
      idPasajero: solicitud.pasajeroId,
      idConductor: id_conductor,
      metodoPago: solicitud.metodoPago,
      monto: solicitud.precioEstimadoCents ? solicitud.precioEstimadoCents / 100 : 0
    })
  }).catch(console.error)

  return NextResponse.json({
    id_viaje: viaje.id,
    id_solicitud: solicitud.id,
    estado_actual: viaje.estadoActual,
    precio_estimado: solicitud.precioEstimadoCents != null ? solicitud.precioEstimadoCents / 100 : null,
    metodo_pago: solicitud.metodoPago,
    pasajero: {
      id_pasajero: solicitud.pasajero.publicId ?? solicitud.pasajero.id,
    },
    origen: {
      direccion: solicitud.origenDireccion,
      latitud: solicitud.origenLat,
      longitud: solicitud.origenLng,
    },
    destino: {
      direccion: solicitud.destinoDireccion,
      latitud: solicitud.destinoLat,
      longitud: solicitud.destinoLng,
    },
  }, { status: 201 })
}
