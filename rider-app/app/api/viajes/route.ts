import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const m2mError = requireM2MToken(req)
  if (m2mError) return m2mError
  
  const body = await req.json()
  const { id_solicitud, id_conductor, id_vehiculo, latitud_actual, longitud_actual } = body

  if (!id_solicitud || !id_conductor || !id_vehiculo || latitud_actual === undefined || longitud_actual === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id: id_solicitud },
    include: { pasajero: true },
  })

  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  if (solicitud.estado !== "BUSCANDO_CONDUCTOR") {
    return NextResponse.json({ error: "La solicitud no está disponible" }, { status: 409 })
  }

  const [viaje] = await prisma.$transaction([
    prisma.viaje.create({
      data: {
        solicitudId: id_solicitud,
        idConductor: id_conductor,
        idVehiculo: id_vehiculo,
        latitudActual: latitud_actual,
        longitudActual: longitud_actual,
        estadoActual: "ACEPTADO",
      },
    }),
    prisma.solicitudDeViaje.update({
      where: { id: id_solicitud },
      data: { estado: "ACEPTADA" },
    }),
  ])

  return NextResponse.json({
    id_viaje: viaje.id,
    id_solicitud: solicitud.id,
    estado_actual: viaje.estadoActual,
    precio_estimado: solicitud.precioEstimadoCents,
    metodo_pago: solicitud.metodoPago,
    pasajero: {
      id_pasajero: solicitud.pasajero.id,
      nombre: solicitud.pasajero.nombre,
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
