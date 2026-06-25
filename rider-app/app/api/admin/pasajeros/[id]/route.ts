import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["admin"])
  if ("error" in auth) return auth.error

  const { id } = await params

  const pasajero = await prisma.pasajero.findUnique({ where: { id }, select: { activo: true } })
  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })

  const updated = await prisma.pasajero.update({
    where: { id },
    data: { activo: !pasajero.activo },
    select: { id: true, activo: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["admin"])
  if ("error" in auth) return auth.error

  const { id } = await params

  const pasajero = await prisma.pasajero.findUnique({
    where: { id },
    select: { solicitudes: { select: { id: true } } },
  })
  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })

  const solicitudIds = pasajero.solicitudes.map((s) => s.id)

  await prisma.$transaction([
    prisma.viaje.deleteMany({ where: { solicitudId: { in: solicitudIds } } }),
    prisma.transaccion.deleteMany({ where: { solicitudId: { in: solicitudIds } } }),
    prisma.solicitudDeViaje.deleteMany({ where: { pasajeroId: id } }),
    prisma.direccionFrecuente.deleteMany({ where: { pasajeroId: id } }),
    prisma.pasajero.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
