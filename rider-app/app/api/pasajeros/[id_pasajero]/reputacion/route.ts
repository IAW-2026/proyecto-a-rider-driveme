import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"
import { resolvePublicIdToInternalId } from "@/lib/ids"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id_pasajero: string }> }
) {
  const authError = requireM2MToken(req)
  if (authError) return authError

  let { id_pasajero } = await params

  if (typeof id_pasajero === "string" && id_pasajero.startsWith("pas_")) {
    id_pasajero = (await resolvePublicIdToInternalId(id_pasajero)) ?? id_pasajero
  }

  const body = await req.json()
  const { rating_promedio } = body

  if (rating_promedio === undefined) {
    return NextResponse.json({ error: "Falta rating_promedio" }, { status: 400 })
  }

  const pasajero = await prisma.pasajero.findUnique({ where: { id: id_pasajero } })
  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  const actualizado = await prisma.pasajero.update({
    where: { id: id_pasajero },
    data: { ratingPromedio: rating_promedio },
    select: { id: true, publicId: true, ratingPromedio: true },
  })

  return NextResponse.json({
    id_pasajero: actualizado.publicId ?? actualizado.id,
    rating_promedio: Number(actualizado.ratingPromedio),
  })
}
