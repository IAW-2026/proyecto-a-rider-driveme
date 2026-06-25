import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, requireM2MToken } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  const isM2M = requireM2MToken(req) === null
  if (!isM2M) {
    const auth = await requireRole("admin")
    if ("error" in auth) return auth.error
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const estado = searchParams.get("estado") ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)))
  const skip = (page - 1) * limit

  const where: Prisma.SolicitudDeViajeWhereInput = {}

  if (estado) {
    where.estado = estado as Prisma.EnumEstadoSolicitudFilter["equals"]
  }

  if (q) {
    where.pasajero = {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }
  }

  const [solicitudes, total] = await Promise.all([
    prisma.solicitudDeViaje.findMany({
      where,
      skip,
      take: limit,
      orderBy: { creadaEn: "desc" },
      include: {
        pasajero: { select: { id: true, nombre: true, email: true } },
      },
    }),
    prisma.solicitudDeViaje.count({ where }),
  ])

  return NextResponse.json({
    solicitudes: solicitudes.map((s) => ({
      id_solicitud: s.id,
      pasajero: s.pasajero,
      origen: { lat: s.origenLat, lng: s.origenLng },
      destino: s.destinoLat != null ? { lat: s.destinoLat, lng: s.destinoLng } : null,
      precio_estimado: s.precioEstimadoCents,
      metodo_pago: s.metodoPago,
      estado: s.estado,
      creada_en: s.creadaEn,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
