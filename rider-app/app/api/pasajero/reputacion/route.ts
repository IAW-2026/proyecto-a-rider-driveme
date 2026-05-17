import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"
import { resolvePublicIdToInternalId } from "@/lib/ids"

// Feedback App actualiza el rating promedio del pasajero
export async function POST(req: NextRequest) {
  const authError = requireM2MToken(req)
  if (authError) return authError

  const body = await req.json()
  let { id_pasajero, puntaje } = body

  if (!id_pasajero || puntaje === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  // aceptar tanto id interno (UUID) como publicId (pas_...)
  if (typeof id_pasajero === "string" && id_pasajero.startsWith("pas_")) {
    id_pasajero = await resolvePublicIdToInternalId(id_pasajero)
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
