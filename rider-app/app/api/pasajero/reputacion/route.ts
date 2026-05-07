import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"

// Feedback App actualiza el rating promedio del pasajero
export async function POST(req: NextRequest) {
  const authError = requireM2MToken(req)
  if (authError) return authError

  const body = await req.json()
  const { id_pasajero, puntaje } = body

  if (!id_pasajero || puntaje === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const pasajero = await prisma.pasajero.findUnique({ where: { id: id_pasajero } })

  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  await prisma.pasajero.update({
    where: { id: id_pasajero },
    data: { ratingPromedio: puntaje },
  })

  return NextResponse.json({ ok: true })
}
