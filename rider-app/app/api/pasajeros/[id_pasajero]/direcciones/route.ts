import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { resolvePublicIdToInternalId } from "@/lib/ids"

async function resolvePasajeroId(id_pasajero: string): Promise<string> {
  if (id_pasajero.startsWith("pas_")) {
    return (await resolvePublicIdToInternalId(id_pasajero)) ?? id_pasajero
  }
  return id_pasajero
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id_pasajero: string }> }
) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const { id_pasajero } = await params
  const internalId = await resolvePasajeroId(id_pasajero)

  const pasajero = await prisma.pasajero.findUnique({
    where: { id: internalId },
    select: { id: true, clerkId: true },
  })

  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  if (auth.role !== "admin" && pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const direcciones = await prisma.direccionFrecuente.findMany({
    where: { pasajeroId: pasajero.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, nombre: true, direccion: true, latitud: true, longitud: true },
  })

  return NextResponse.json(direcciones)
}

const postSchema = z.object({
  nombre: z.string().min(1).max(50),
  direccion: z.string().min(3).max(255),
  latitud: z.number(),
  longitud: z.number(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id_pasajero: string }> }
) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const { id_pasajero } = await params
  const internalId = await resolvePasajeroId(id_pasajero)

  const pasajero = await prisma.pasajero.findUnique({
    where: { id: internalId },
    select: { id: true, clerkId: true },
  })

  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  if (auth.role !== "admin" && pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const total = await prisma.direccionFrecuente.count({ where: { pasajeroId: pasajero.id } })
  if (total >= 10) {
    return NextResponse.json({ error: "Máximo 10 direcciones frecuentes" }, { status: 400 })
  }

  const nueva = await prisma.direccionFrecuente.create({
    data: { ...parsed.data, pasajeroId: pasajero.id },
    select: { id: true, nombre: true, direccion: true, latitud: true, longitud: true },
  })

  return NextResponse.json(nueva, { status: 201 })
}
