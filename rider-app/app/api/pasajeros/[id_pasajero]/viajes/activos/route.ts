import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolvePublicIdToInternalId } from "@/lib/ids"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id_pasajero: string }> }
) {
  let { id_pasajero } = await params

  // aceptar publicId (pas_...) o id interno
  if (typeof id_pasajero === "string" && id_pasajero.startsWith("pas_")) {
    id_pasajero = await resolvePublicIdToInternalId(id_pasajero) ?? id_pasajero
  }

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
