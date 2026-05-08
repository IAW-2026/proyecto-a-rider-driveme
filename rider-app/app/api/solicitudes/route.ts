import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

// Driver App consulta solicitudes disponibles
export async function GET(req: NextRequest) {
  const auth = await requireRole("driver")
  if ("error" in auth) return auth.error

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado") ?? "BUSCANDO_CONDUCTOR"

  const solicitudes = await prisma.solicitudDeViaje.findMany({
    where: { estado: estado as never },
    include: { pasajero: { select: { id: true, nombre: true, ratingPromedio: true } } },
    orderBy: { creadaEn: "desc" },
  })

  return NextResponse.json(
    solicitudes.map((s: typeof solicitudes[number]) => ({
      id_solicitud: s.id,
      id_pasajero: s.pasajeroId,
      pasajero: s.pasajero,
      origen: { latitud: s.origenLat, longitud: s.origenLng },
      destino: { latitud: s.destinoLat, longitud: s.destinoLng },
      precio_estimado: s.precioEstimadoCents,
      metodo_pago: s.metodoPago,
      estado: s.estado,
      creada_en: s.creadaEn,
    }))
  )
}

// Pasajero crea una nueva solicitud de viaje
export async function POST(req: NextRequest) {
  const auth = await requireRole("rider")
  if ("error" in auth) return auth.error

  let pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: auth.userId },
  })

  // Primer uso: crear el registro del pasajero con los datos de Clerk
  if (!pasajero) {
    const clerkUser = await currentUser()
    if (!clerkUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    pasajero = await prisma.pasajero.create({
      data: {
        clerkId: clerkUser.id,
        nombre: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      },
    })
  }

  const body = await req.json()
  const { origen_lat, origen_lng, destino_lat, destino_lng, metodo_pago, precio_estimado } = body

  if (!origen_lat || !origen_lng || !metodo_pago) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const solicitud = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: pasajero.id,
      origenLat: origen_lat,
      origenLng: origen_lng,
      destinoLat: destino_lat ?? null,
      destinoLng: destino_lng ?? null,
      metodoPago: metodo_pago,
      precioEstimadoCents: precio_estimado ?? null,
      estado: "BUSCANDO_CONDUCTOR",
    },
  })

  return NextResponse.json({
    id_solicitud: solicitud.id,
    estado: solicitud.estado,
  }, { status: 201 })
}
