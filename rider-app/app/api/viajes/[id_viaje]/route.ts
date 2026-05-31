import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id_viaje: string }> }
) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const { id_viaje } = await params

  const viaje = await prisma.viaje.findUnique({
    where: { id: id_viaje },
    include: {
      solicitud: {
        include: {
          pasajero: { select: { id: true, publicId: true, clerkId: true, nombre: true } },
        },
      },
    },
  })

  if (!viaje) {
    return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })
  }

  if (auth.role !== "admin" && viaje.solicitud.pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  return NextResponse.json({
    id_viaje: viaje.id,
    estado_actual: viaje.estadoActual,
    id_conductor: viaje.idConductor,
    id_vehiculo: viaje.idVehiculo,
    creado_en: viaje.createdAt,
    solicitud: {
      id_solicitud: viaje.solicitudId,
      origen: { direccion: viaje.solicitud.origenDireccion, lat: viaje.solicitud.origenLat, lng: viaje.solicitud.origenLng },
      destino: { direccion: viaje.solicitud.destinoDireccion, lat: viaje.solicitud.destinoLat, lng: viaje.solicitud.destinoLng },
      precio_estimado: viaje.solicitud.precioEstimadoCents != null ? viaje.solicitud.precioEstimadoCents / 100 : null,
      metodo_pago: viaje.solicitud.metodoPago,
      pasajero: {
        id: viaje.solicitud.pasajero.publicId ?? viaje.solicitud.pasajero.id,
        nombre: viaje.solicitud.pasajero.nombre,
      },
    },
  })
}
