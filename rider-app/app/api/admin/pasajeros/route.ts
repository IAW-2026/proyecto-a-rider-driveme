import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, requireM2MToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const isM2M = requireM2MToken(req) === null
  if (!isM2M) {
    const auth = await requireRole("admin")
    if ("error" in auth) return auth.error
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)))
  const skip = (page - 1) * limit

  const where = q
    ? {
        OR: [
          { nombre: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [pasajeros, total] = await Promise.all([
    prisma.pasajero.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        ratingPromedio: true,
        activo: true,
        createdAt: true,
      },
    }),
    prisma.pasajero.count({ where }),
  ])

  const mapped = pasajeros.map((p) => ({
    id_pasajero: p.id,
    nombre: p.nombre,
    email: p.email,
    telefono: p.telefono,
    rating_promedio: p.ratingPromedio,
    activo: p.activo,
    fecha_alta: p.createdAt,
  }))

  return NextResponse.json({
    pasajeros: mapped,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
