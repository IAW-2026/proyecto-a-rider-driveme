import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getOrCreatePasajero } from "@/lib/getOrCreatePasajero"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const pasajero = await getOrCreatePasajero()
  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })

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

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const pasajero = await getOrCreatePasajero()
  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })

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
