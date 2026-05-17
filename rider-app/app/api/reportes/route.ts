import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crearReporte } from "@/lib/feedback"

export async function POST(req: NextRequest) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { id_calificacion, motivo, descripcion } = body

  if (!id_calificacion || !motivo || !descripcion?.trim()) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: auth.userId },
    select: { id: true },
  })

  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  const reporte = await crearReporte({
    id_reportante: pasajero.id,
    id_calificacion,
    motivo,
    descripcion: String(descripcion).trim(),
  })

  return NextResponse.json(reporte, { status: 201 })
}
