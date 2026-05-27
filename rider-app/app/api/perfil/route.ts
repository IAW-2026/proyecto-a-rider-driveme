import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      ratingPromedio: true,
      comentarioPromedio: true,
    },
  })

  if (!pasajero) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })

  return NextResponse.json(pasajero)
}

const patchSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  telefono: z.string().min(6).max(20).optional(),
})

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const pasajero = await prisma.pasajero.update({
    where: { clerkId: userId },
    data: parsed.data,
    select: { id: true, nombre: true, email: true, telefono: true, ratingPromedio: true },
  })

  return NextResponse.json(pasajero)
}
