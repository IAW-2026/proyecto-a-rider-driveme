import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crearResena } from "@/lib/feedback"

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
    select: { id: true },
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

  if (viaje.estadoActual !== "FINALIZADO") {
    return NextResponse.json({ error: "Solo podés dejar feedback al finalizar el viaje" }, { status: 409 })
  }

  const feedback = await crearResena({
    id_viaje,
    id_emisor: pasajero.id,
    id_receptor,
    puntaje: puntajeNumero,
    comentario: String(comentario).trim(),
  })

  return NextResponse.json(feedback, { status: 201 })
}