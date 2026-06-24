import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id_solicitud: string }> }
) {
  const auth = await requireRole(["admin"])
  if ("error" in auth) return auth.error

  const { id_solicitud } = await params

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id: id_solicitud },
    select: { id: true, viaje: { select: { id: true } } },
  })
  if (!solicitud) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    if (solicitud.viaje) {
      await tx.viaje.delete({ where: { id: solicitud.viaje!.id } })
    }
    await tx.transaccion.deleteMany({ where: { solicitudId: id_solicitud } })
    await tx.solicitudDeViaje.delete({ where: { id: id_solicitud } })
  })

  return NextResponse.json({ ok: true })
}
