import { prisma } from "@/lib/prisma"

export type TransaccionInfo = {
  idTransaccion: string
  estado: string
  monto: number        // en pesos
  metodoPago: string | null
  fechaCreacion: string
}

function getPaymentsBaseUrl() {
  return process.env.PAYMENTS_APP_URL?.replace(/\/$/, "") ?? null
}

function buildPaymentsHeaders() {
  const headers: Record<string, string> = {}
  if (process.env.INTERNAL_API_KEY) {
    headers["x-api-key"] = process.env.INTERNAL_API_KEY
  }
  return headers
}

export async function obtenerTransaccionViaje(idViaje: string): Promise<TransaccionInfo | null> {
  const baseUrl = getPaymentsBaseUrl()

  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/pagos/transacciones`, {
        headers: buildPaymentsHeaders(),
        cache: "no-store",
      })
      if (res.ok) {
        const data = (await res.json()) as Array<{
          idViaje: string
          idTransaccion: string
          estado: string
          monto: string
          metodoPago: string | null
          fechaCreacion: string
        }>
        const match = data.find((t) => t.idViaje === idViaje)
        if (!match) return null
        return {
          idTransaccion: match.idTransaccion,
          estado: match.estado,
          monto: parseFloat(match.monto),
          metodoPago: match.metodoPago ?? null,
          fechaCreacion: match.fechaCreacion,
        }
      }
    } catch {
      // fallback a Prisma
    }
  }

  const t = await prisma.transaccion.findFirst({
    where: { viajeId: idViaje },
    orderBy: { createdAt: "desc" },
    select: {
      idTransaccion: true,
      estado: true,
      monto: true,
      createdAt: true,
      viaje: {
        select: {
          solicitud: {
            select: { metodoPago: true },
          },
        },
      },
    },
  })

  if (!t) return null

  return {
    idTransaccion: t.idTransaccion,
    estado: t.estado,
    monto: Number(t.monto) / 100,
    metodoPago: t.viaje.solicitud.metodoPago ?? null,
    fechaCreacion: t.createdAt.toISOString(),
  }
}
