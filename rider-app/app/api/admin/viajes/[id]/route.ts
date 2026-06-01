import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["admin"])
  if ("error" in auth) return auth.error

  const { id } = await params

  const viaje = await prisma.viaje.findUnique({ where: { id }, select: { id: true } })
  if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })

  await prisma.$transaction([
    prisma.transaccion.deleteMany({ where: { viajeId: id } }),
    prisma.viaje.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
