import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id_solicitud: string }> }) {
  const auth = await requireRole("admin")
  if ("error" in auth) return auth.error

  const { id_solicitud } = await params

  const viaje = await prisma.viaje.findFirst({ where: { solicitudId: id_solicitud } })
  if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })
  if (viaje.estadoActual === "FINALIZADO" || viaje.estadoActual === "CANCELADO_POR_CONDUCTOR")
    return NextResponse.json({ error: "El viaje ya está en un estado terminal" }, { status: 409 })

  await prisma.viaje.update({ where: { id: viaje.id }, data: { estadoActual: "CANCELADO_POR_CONDUCTOR" } })
  return NextResponse.json({ ok: true })
}
