import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { resolvePublicIdToInternalId } from "@/lib/ids"
import { obtenerCalificacionesUsuario } from "@/lib/feedback"

async function resolveUsuarioId(idUsuario: string) {
  if (idUsuario.startsWith("pas_")) {
    return (await resolvePublicIdToInternalId(idUsuario)) ?? idUsuario
  }

  return idUsuario
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id_usuario: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id_usuario } = await params
  const internalId = await resolveUsuarioId(id_usuario)

  const pasajero = await prisma.pasajero.findUnique({
    where: { id: internalId },
    select: { id: true, clerkId: true },
  })

  if (!pasajero) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  if (pasajero.clerkId !== userId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const calificaciones = await obtenerCalificacionesUsuario(id_usuario)

  return NextResponse.json({
    ...calificaciones,
    id_usuario: calificaciones.id_usuario ?? id_usuario,
  })
}