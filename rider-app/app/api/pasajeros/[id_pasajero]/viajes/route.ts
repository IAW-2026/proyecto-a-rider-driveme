import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { resolvePublicIdToInternalId } from "@/lib/ids"

async function resolvePasajeroId(id_pasajero: string): Promise<string> {
  if (id_pasajero.startsWith("pas_")) {
    return (await resolvePublicIdToInternalId(id_pasajero)) ?? id_pasajero
  }
  return id_pasajero
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id_pasajero: string }> }
) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const { id_pasajero } = await params
  const internalId = await resolvePasajeroId(id_pasajero)

  const pasajero = await prisma.pasajero.findUnique({
    where: { id: internalId },
    select: { id: true, clerkId: true },
  })

  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  if (auth.role !== "admin" && pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")))
  const skip = (page - 1) * limit

  const [viajes, total] = await Promise.all([
    prisma.viaje.findMany({
      where: { solicitud: { pasajeroId: pasajero.id } },
      include: {
        solicitud: {
          select: {
            origenDireccion: true,
            origenLat: true,
            origenLng: true,
            destinoDireccion: true,
            destinoLat: true,
            destinoLng: true,
            precioEstimadoCents: true,
            metodoPago: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.viaje.count({ where: { solicitud: { pasajeroId: pasajero.id } } }),
  ])

  return NextResponse.json({
    data: viajes.map((v) => ({
      id_viaje: v.id,
      estado_actual: v.estadoActual,
      id_conductor: v.idConductor,
      creado_en: v.createdAt,
      solicitud: {
        origen: { direccion: v.solicitud.origenDireccion, lat: v.solicitud.origenLat, lng: v.solicitud.origenLng },
        destino: { direccion: v.solicitud.destinoDireccion, lat: v.solicitud.destinoLat, lng: v.solicitud.destinoLng },
        precio_estimado: v.solicitud.precioEstimadoCents != null ? v.solicitud.precioEstimadoCents / 100 : null,
        metodo_pago: v.solicitud.metodoPago,
      },
    })),
    pagination: { page, limit, total },
  })
}
