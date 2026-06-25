import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id_solicitud: string }> }
) {
  const authError = requireM2MToken(req)
  if (authError) return authError

  const { id_solicitud } = await params
  const body = await req.json()
  const { estado_pago, id_transaccion, monto } = body

  if (!id_transaccion || !estado_pago || monto === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  if (!["APROBADO", "RECHAZADO"].includes(estado_pago)) {
    return NextResponse.json({ error: "Estado de transacción inválido" }, { status: 400 })
  }

  const solicitud = await prisma.solicitudDeViaje.findUnique({ where: { id: id_solicitud } })

  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  if (solicitud.estado !== "PENDIENTE_PAGO") {
    return NextResponse.json({ error: "La solicitud no se encuentra en estado PENDIENTE_PAGO" }, { status: 409 })
  }

  const nuevoEstado = estado_pago === "APROBADO" ? "BUSCANDO_CONDUCTOR" : "PAGO_RECHAZADO"

  // Mapear estados del contrato a valores internos de DB
  const estadoInterno = estado_pago === "APROBADO" ? "CAPTURED" : "FAILED"

  await prisma.$transaction([
    prisma.transaccion.create({
      data: {
        solicitudId: id_solicitud,
        idTransaccion: id_transaccion,
        estado: estadoInterno,
        monto: Math.round(monto * 100),
      },
    }),
    prisma.solicitudDeViaje.update({
      where: { id: id_solicitud },
      data: {
        estado: nuevoEstado,
        buscandoConductorDesde: estado_pago === "APROBADO" ? new Date() : undefined,
      },
    }),
  ])

  return NextResponse.json({
    id_solicitud,
    estado: nuevoEstado,
  })
}
