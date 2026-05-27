import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id_solicitud: string }> }
) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const { id_solicitud } = await params

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id: id_solicitud },
    include: { pasajero: true },
  })

  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  if (solicitud.pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos sobre esta solicitud" }, { status: 403 })
  }

  if (solicitud.estado !== "BUSCANDO_CONDUCTOR") {
    return NextResponse.json(
      { error: "La solicitud no está en estado BUSCANDO_CONDUCTOR" },
      { status: 409 }
    )
  }

  await prisma.$transaction([
    prisma.viaje.create({
      data: {
        solicitudId: id_solicitud,
        idConductor: "conductor-mock-001",
        estadoActual: "EN_CURSO",
      },
    }),
    prisma.solicitudDeViaje.update({
      where: { id: id_solicitud },
      data: { estado: "ACEPTADA" },
    }),
  ])

  return NextResponse.json({ ok: true })
}
