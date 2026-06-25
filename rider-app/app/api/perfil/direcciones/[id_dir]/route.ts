import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id_dir: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id_dir } = await params

  const pasajero = await prisma.pasajero.findUnique({ where: { clerkId: userId }, select: { id: true } })
  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })

  const direccion = await prisma.direccionFrecuente.findUnique({ where: { id: id_dir } })
  if (!direccion || direccion.pasajeroId !== pasajero.id) {
    return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 })
  }

  await prisma.direccionFrecuente.delete({ where: { id: id_dir } })

  return NextResponse.json({ ok: true })
}
