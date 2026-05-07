import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id_pasajero: string }> }
) {
  const { id_pasajero } = await params

  const solicitud = await prisma.solicitudDeViaje.findFirst({
    where: {
      pasajeroId: id_pasajero,
      estado: { in: ["BUSCANDO_CONDUCTOR", "ACEPTADA"] },
    },
    include: { viaje: true },
    orderBy: { creadaEn: "desc" },
  })

  if (!solicitud) {
    return NextResponse.json({ id_pasajero, viaje_activo: null })
  }

  return NextResponse.json({
    id_pasajero,
    viaje_activo: {
      id_viaje: solicitud.viaje?.id ?? null,
      id_solicitud: solicitud.id,
      estado_actual: solicitud.viaje?.estadoActual ?? solicitud.estado,
      id_conductor: solicitud.viaje?.idConductor ?? null,
    },
  })
}
