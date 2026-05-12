import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const auth = await requireRole("admin")
  if ("error" in auth) return auth.error

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
        createdAt: true,
        _count: { select: { solicitudes: true } },
      },
    }),
    prisma.pasajero.count({ where }),
  ])

  return NextResponse.json({
    pasajeros,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
