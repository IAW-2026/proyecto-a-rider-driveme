import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })

  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  const transacciones = await prisma.transaccion.findMany({
    where: {
      solicitud: {
        pasajeroId: pasajero.id,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      solicitudId: true,
      idTransaccion: true,
      estado: true,
      monto: true,
      createdAt: true,
      solicitud: {
        select: {
          metodoPago: true,
        },
      },
    },
  })

  return NextResponse.json(
    transacciones.map((transaccion) => ({
      id: transaccion.id,
      idSolicitud: transaccion.solicitudId,
      monto: (transaccion.monto / 100).toFixed(2),
      metodoPago: transaccion.solicitud.metodoPago,
      estado: transaccion.estado,
      fechaCreacion: transaccion.createdAt,
      idTransaccion: transaccion.idTransaccion,
    }))
  )
}