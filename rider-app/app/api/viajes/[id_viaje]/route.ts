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

  // Intentar obtener el estado más fresco desde la Driver App
  let estadoActual = viaje.estadoActual
  const driverAppUrl = process.env.DRIVER_APP_URL?.replace(/\/$/, "")
  const driverIdViaje = viaje.idViajeDriver ?? viaje.id

  if (driverAppUrl) {
    try {
      const res = await fetch(`${driverAppUrl}/api/viajes/${driverIdViaje}/estado`, {
        headers: { "x-api-key": process.env.RIDER_SERVICE_SECRET ?? "" },
        next: { revalidate: 0 },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.estado_actual) {
          estadoActual = data.estado_actual
          // Si el estado cambió, actualizarlo en nuestra BD también
          if (data.estado_actual !== viaje.estadoActual) {
            await prisma.viaje.update({
              where: { id: viaje.id },
              data: { estadoActual: data.estado_actual },
            }).catch(() => {})
          }
        }
      }
    } catch {
      // Si Driver App no responde, usamos el estado local (ya inicializado arriba)
    }
  }

  return NextResponse.json({
    id_viaje: viaje.id,
    estado_actual: estadoActual,
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

