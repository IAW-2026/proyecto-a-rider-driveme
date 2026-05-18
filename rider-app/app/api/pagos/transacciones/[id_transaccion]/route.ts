import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id_transaccion: string }> }
) {
  const m2mError = requireM2MToken(req)
  if (m2mError) return m2mError

  const { id_transaccion } = await params

  // Buscar en DB de Rider (puede ser id interno o idTransaccion externo de Payments)
  const transaccion = await prisma.transaccion.findFirst({
    where: {
      OR: [{ id: id_transaccion }, { idTransaccion: id_transaccion }],
    },
  })

  if (transaccion) {
    return NextResponse.json({
      id_transaccion: transaccion.idTransaccion,
      estado: transaccion.estado,
      monto: transaccion.monto / 100,
      created_at: transaccion.createdAt,
    })
  }

  // Mock: Payments aún no confirmó el pago
  return NextResponse.json({
    id_transaccion,
    estado: "PENDIENTE",
    monto: null,
    created_at: null,
  })
}
