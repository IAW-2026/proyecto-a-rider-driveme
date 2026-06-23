import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireM2MToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const m2mError = requireM2MToken(req)
  if (m2mError) return m2mError

  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)

  const [
    // Pasajeros
    totalPasajeros,
    pasajerosActivos,
    nuevosUltimos30Dias,
    reputacionAgg,
    // Solicitudes
    totalSolicitudes,
    solicitudesPendientes,
    solicitudesAceptadas,
    solicitudesCanceladas,
    precioAgg,
    pagoEfectivo,
    pagoTarjeta,
    // Viajes
    totalViajes,
    viajesEnCurso,
    viajesFinalizados,
    viajesCancelados,
    calificacionAgg,
    // Transacciones
    transaccionesExitosas,
    transaccionesFallidas,
    ingresosAgg,
  ] = await Promise.all([
    // --- Pasajeros ---
    prisma.pasajero.count(),
    prisma.pasajero.count({ where: { activo: true } }),
    prisma.pasajero.count({ where: { createdAt: { gte: hace30Dias } } }),
    prisma.pasajero.aggregate({ _avg: { ratingPromedio: true } }),
    // --- Solicitudes ---
    prisma.solicitudDeViaje.count(),
    prisma.solicitudDeViaje.count({ where: { estado: "BUSCANDO_CONDUCTOR" } }),
    prisma.solicitudDeViaje.count({ where: { estado: "ACEPTADA" } }),
    prisma.solicitudDeViaje.count({
      where: { estado: { in: ["CANCELADA_POR_PASAJERO", "EXPIRADA_SIN_ACEPTACION"] } },
    }),
    prisma.solicitudDeViaje.aggregate({ _avg: { precioEstimadoCents: true } }),
    prisma.solicitudDeViaje.count({ where: { metodoPago: "EFECTIVO" } }),
    prisma.solicitudDeViaje.count({ where: { metodoPago: "TARJETA" } }),
    // --- Viajes ---
    prisma.viaje.count(),
    prisma.viaje.count({ where: { estadoActual: "EN_CURSO" } }),
    prisma.viaje.count({ where: { estadoActual: "FINALIZADO" } }),
    prisma.viaje.count({ where: { estadoActual: "CANCELADO_POR_CONDUCTOR" } }),
    prisma.viaje.aggregate({ _avg: { puntajeCalificacion: true } }),
    // --- Transacciones ---
    prisma.transaccion.count({ where: { estado: "CAPTURED" } }),
    prisma.transaccion.count({ where: { estado: "FAILED" } }),
    prisma.transaccion.aggregate({
      where: { estado: "CAPTURED" },
      _sum: { monto: true },
      _avg: { monto: true },
    }),
  ])

  const tasaAceptacion = totalSolicitudes > 0
    ? Math.round((solicitudesAceptadas / totalSolicitudes) * 10000) / 100
    : 0

  return NextResponse.json({
    metricas: {
      pasajeros: {
        total: totalPasajeros,
        activos: pasajerosActivos,
        inactivos: totalPasajeros - pasajerosActivos,
        nuevosUltimos30Dias,
        reputacionPromedio: Number(reputacionAgg._avg.ratingPromedio ?? 0),
      },
      solicitudes: {
        total: totalSolicitudes,
        pendientes: solicitudesPendientes,
        aceptadas: solicitudesAceptadas,
        canceladas: solicitudesCanceladas,
        tasaAceptacion,
        precioEstimadoPromedio: Math.round(precioAgg._avg.precioEstimadoCents ?? 0),
      },
      viajes: {
        total: totalViajes,
        enCurso: viajesEnCurso,
        finalizados: viajesFinalizados,
        canceladosPorConductor: viajesCancelados,
        calificacionPromedio: Number(calificacionAgg._avg.puntajeCalificacion ?? 0),
      },
      ingresos: {
        totalRecaudado: ingresosAgg._sum.monto ?? 0,
        montoPromedioPorViaje: Math.round(ingresosAgg._avg.monto ?? 0),
        transaccionesExitosas,
        transaccionesFallidas,
      },
      metodoPago: {
        efectivo: pagoEfectivo,
        tarjeta: pagoTarjeta,
      },
    },
  })
}
