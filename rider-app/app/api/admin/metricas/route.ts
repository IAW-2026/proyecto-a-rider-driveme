import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const m2mError = requireM2MToken(req)
  if (m2mError) return m2mError

  const [
    totalPasajeros,
    pasajerosActivos,
    totalSolicitudes,
    solicitudesPendientes,
    solicitudesAceptadas,
    solicitudesCanceladas,
    reputacionAgg,
  ] = await Promise.all([
    prisma.pasajero.count(),
    prisma.pasajero.count({ where: { activo: true } }),
    prisma.solicitudDeViaje.count(),
    prisma.solicitudDeViaje.count({ where: { estado: "BUSCANDO_CONDUCTOR" } }),
    prisma.solicitudDeViaje.count({ where: { estado: "ACEPTADA" } }),
    prisma.solicitudDeViaje.count({
      where: { estado: { in: ["CANCELADA_POR_PASAJERO", "EXPIRADA_SIN_ACEPTACION"] } },
    }),
    prisma.pasajero.aggregate({ _avg: { ratingPromedio: true } }),
  ])

  return NextResponse.json({
    metricas: {
      totalPasajeros,
      pasajerosActivos,
      totalSolicitudes,
      solicitudesPendientes,
      solicitudesAceptadas,
      solicitudesCanceladas,
      reputacionPromedio: reputacionAgg._avg.ratingPromedio ?? 0,
    },
  })
}
