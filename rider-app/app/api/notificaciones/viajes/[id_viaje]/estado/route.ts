import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id_viaje: string }> }
) {
  const authError = requireM2MToken(req)
  if (authError) return authError

  const { id_viaje } = await params
  const body = await req.json()
  const { estado_actual } = body

  if (!["EN_CURSO", "FINALIZADO", "CANCELADO_POR_CONDUCTOR"].includes(estado_actual)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  const viaje = await prisma.viaje.findFirst({
    where: { OR: [{ id: id_viaje }, { idViajeDriver: id_viaje }] },
  })

  if (!viaje) {
    return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })
  }

  await prisma.viaje.update({
    where: { id: viaje.id },
    data: { estadoActual: estado_actual },
  })

  return NextResponse.json({ ok: true })
}
