import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const auth = await requireRole("driver")
  if ("error" in auth) return auth.error
  const body = await req.json()
  const { id_solicitud, id_conductor } = body

  if (!id_solicitud || !id_conductor) {
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
    estado_actual: viaje.estadoActual,
    pasajero: {
      id_pasajero: solicitud.pasajero.id,
      nombre: solicitud.pasajero.nombre,
    },
    origen: {
      latitud: solicitud.origenLat,
      longitud: solicitud.origenLng,
    },
    destino: {
      latitud: solicitud.destinoLat,
      longitud: solicitud.destinoLng,
    },
  }, { status: 201 })
}
