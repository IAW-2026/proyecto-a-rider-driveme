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
    select: { id: true, publicId: true, clerkId: true, nombre: true, email: true, telefono: true, ratingPromedio: true, activo: true, createdAt: true },
  })

  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  if (auth.role !== "admin" && pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  return NextResponse.json({
    id: pasajero.publicId ?? pasajero.id,
    nombre: pasajero.nombre,
    email: pasajero.email,
    telefono: pasajero.telefono,
    rating_promedio: Number(pasajero.ratingPromedio),
    activo: pasajero.activo,
    creado_en: pasajero.createdAt,
  })
}

const patchSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  telefono: z.string().min(6).max(20).optional(),
})

export async function PATCH(
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
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const actualizado = await prisma.pasajero.update({
    where: { id: internalId },
    data: parsed.data,
    select: { id: true, publicId: true, nombre: true, email: true, telefono: true, ratingPromedio: true },
  })

  return NextResponse.json({
    id: actualizado.publicId ?? actualizado.id,
    nombre: actualizado.nombre,
    email: actualizado.email,
    telefono: actualizado.telefono,
    rating_promedio: Number(actualizado.ratingPromedio),
  })
}
