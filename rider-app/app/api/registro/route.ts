import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  telefono: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { nombre, apellido, telefono } = parsed.data
  const nombreCompleto = `${nombre} ${apellido}`.trim()

  const clerkUser = await currentUser()
  const rawEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? ""
  const email = rawEmail || `${userId}@noemail.rider`

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role: "rider" },
  })

  // Buscar por clerkId primero, luego por email (re-linking si el usuario recreó su cuenta)
  let pasajero = await prisma.pasajero.findUnique({ where: { clerkId: userId } })
  if (!pasajero) {
    pasajero = await prisma.pasajero.findUnique({ where: { email } })
  }

  if (pasajero) {
    await prisma.pasajero.update({
      where: { id: pasajero.id },
      data: { clerkId: userId, nombre: nombreCompleto, telefono },
    })
  } else {
    await prisma.pasajero.create({
      data: { clerkId: userId, email, nombre: nombreCompleto, telefono },
    })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
