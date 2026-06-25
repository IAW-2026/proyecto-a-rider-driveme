import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crearResena } from "@/lib/feedback"
import { generatePublicId } from "@/lib/ids"

export async function POST(req: NextRequest) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { id_viaje, id_receptor, puntaje, comentario } = body

  if (!id_viaje || !id_receptor || puntaje === undefined || comentario === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const puntajeNumero = Number(puntaje)
  if (!Number.isFinite(puntajeNumero) || puntajeNumero < 1 || puntajeNumero > 5) {
    return NextResponse.json({ error: "Puntaje inválido" }, { status: 400 })
  }

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: auth.userId },
    select: { id: true, publicId: true, clerkId: true },
  })

  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  const viaje = await prisma.viaje.findFirst({
    where: { id: id_viaje, solicitud: { pasajeroId: pasajero.id } },
    select: { estadoActual: true },
  })

  if (!viaje) {
    return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })
  }

  if (!["FINALIZADO", "CANCELADO_POR_CONDUCTOR"].includes(viaje.estadoActual)) {
    return NextResponse.json({ error: "El viaje todavía no terminó" }, { status: 409 })
  }

  // Ensure pasajero tiene publicId para exponerlo a servicios externos
  let idEmisorPublic = pasajero.publicId
  if (!idEmisorPublic) {
    idEmisorPublic = generatePublicId("pas", pasajero.clerkId ?? pasajero.id)
    await prisma.pasajero.update({ where: { id: pasajero.id }, data: { publicId: idEmisorPublic } })
  }

  const feedback = await crearResena({
    id_viaje,
    id_emisor: idEmisorPublic,
    id_receptor,
    puntaje: puntajeNumero,
    comentario: String(comentario).trim(),
  })

  if (feedback.id_calificacion) {
    await prisma.viaje.update({
      where: { id: id_viaje },
      data: {
        idCalificacion: feedback.id_calificacion,
        puntajeCalificacion: puntajeNumero,
        comentarioCalificacion: String(comentario).trim() || null,
      },
    })
  }

  return NextResponse.json(feedback, { status: 201 })
}