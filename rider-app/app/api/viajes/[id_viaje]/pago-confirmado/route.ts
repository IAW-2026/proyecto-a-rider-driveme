import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id_viaje: string }> }
) {
  const authError = requireM2MToken(req)
  if (authError) return authError

  const { id_viaje } = await params
  const body = await req.json()
  const { id_transaccion, estado, monto } = body

  if (!id_transaccion || !estado || monto === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  if (!["CONFIRMADO", "FALLIDO"].includes(estado)) {
    return NextResponse.json({ error: "Estado de transacción inválido" }, { status: 400 })
  }

  const viaje = await prisma.viaje.findUnique({ where: { id: id_viaje } })

  if (!viaje) {
    return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })
  }

  // Mapear estados del contrato a valores internos de DB
  const estadoInterno = estado === "CONFIRMADO" ? "CAPTURED" : "FAILED"

  await prisma.transaccion.create({
    data: {
      viajeId: id_viaje,
      idTransaccion: id_transaccion,
      estado: estadoInterno,
      monto: Math.round(monto * 100),
    },
  })

  return NextResponse.json({ id_viaje, pago: estado })
}
