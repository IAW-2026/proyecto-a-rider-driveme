import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

async function getPasajeroAndDireccion(userId: string, id_dir: string) {
  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })
  if (!pasajero) return { pasajero: null, direccion: null }

  const direccion = await prisma.direccionFrecuente.findUnique({ where: { id: id_dir } })
  return { pasajero, direccion }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id_dir: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id_dir } = await params
  const { pasajero, direccion } = await getPasajeroAndDireccion(userId, id_dir)

  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  if (!direccion || direccion.pasajeroId !== pasajero.id) {
    return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 })
  }

  await prisma.direccionFrecuente.delete({ where: { id: id_dir } })

  return NextResponse.json({ ok: true })
}

const patchSchema = z.object({
  nombre: z.string().min(1).max(50).optional(),
  direccion: z.string().min(3).max(255).optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id_dir: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id_dir } = await params
  const { pasajero, direccion } = await getPasajeroAndDireccion(userId, id_dir)

  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  if (!direccion || direccion.pasajeroId !== pasajero.id) {
    return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const actualizada = await prisma.direccionFrecuente.update({
    where: { id: id_dir },
    data: parsed.data,
    select: { id: true, nombre: true, direccion: true, latitud: true, longitud: true },
  })

  return NextResponse.json(actualizada)
}
