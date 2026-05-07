import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id_solicitud: string }> }
) {
  const auth = await requireRole("rider")
  if ("error" in auth) return auth.error

  const { id_solicitud } = await params
  const body = await req.json()
  const { estado } = body

  if (estado !== "CANCELADA_POR_PASAJERO") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id: id_solicitud },
    include: { viaje: true, pasajero: true },
  })

  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  if (solicitud.pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos sobre esta solicitud" }, { status: 403 })
  }

  if (solicitud.estado !== "BUSCANDO_CONDUCTOR") {
    return NextResponse.json({ error: "La solicitud ya no puede cancelarse" }, { status: 409 })
  }

  const actualizada = await prisma.solicitudDeViaje.update({
    where: { id: id_solicitud },
    data: { estado: "CANCELADA_POR_PASAJERO" },
  })

  return NextResponse.json({
    id_solicitud: actualizada.id,
    estado: actualizada.estado,
  })
}
