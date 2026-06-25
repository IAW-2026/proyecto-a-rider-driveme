import { NextRequest, NextResponse } from "next/server"
import { requireRole, requireM2MToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isM2M = requireM2MToken(req) === null
  if (!isM2M) {
    const auth = await requireRole(["admin"])
    if ("error" in auth) return auth.error
  }

  const { id } = await params

  const pasajero = await prisma.pasajero.findUnique({ where: { id }, select: { activo: true } })
  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })

  const updated = await prisma.pasajero.update({
    where: { id },
    data: { activo: !pasajero.activo },
    select: { id: true, activo: true },
  })

  return NextResponse.json({ id_pasajero: updated.id, activo: updated.activo })
}
