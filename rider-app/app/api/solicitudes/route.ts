import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { requireRole, requireM2MToken } from "@/lib/auth"
import { z } from "zod"

const solicitudSchema = z.object({
  origen_lat: z.number(),
  origen_lng: z.number(),
  origen_direccion: z.string().optional(),
  destino_lat: z.number().nullable().optional(),
  destino_lng: z.number().nullable().optional(),
  destino_direccion: z.string().optional(),
  metodo_pago: z.enum(["EFECTIVO", "TARJETA"]),
  precio_estimado: z.number().int().positive().nullable().optional(),
})

// Driver App consulta solicitudes disponibles
export async function GET(req: NextRequest) {
  const m2mError = requireM2MToken(req)
  if (m2mError) return m2mError

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
  const auth = await requireRole(["rider", "admin"])
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
  const parsed = solicitudSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { origen_lat, origen_lng, origen_direccion, destino_lat, destino_lng, destino_direccion, metodo_pago } = parsed.data

  // Evitar que el pasajero cree más de una solicitud activa
  const existing = await prisma.solicitudDeViaje.findFirst({
    where: { pasajeroId: pasajero.id, estado: { in: ["BUSCANDO_CONDUCTOR", "ACEPTADA"] } },
    include: { viaje: { select: { estadoActual: true } } },
  })
  const isActive = existing && (!existing.viaje || !["FINALIZADO", "CANCELADO_POR_CONDUCTOR"].includes(existing.viaje.estadoActual))
  if (isActive) {
    return NextResponse.json({ error: "Ya existe una solicitud activa." }, { status: 409 })
  }

  const solicitud = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: pasajero.id,
      origenLat: origen_lat,
      origenLng: origen_lng,
      origenDireccion: origen_direccion ?? null,
      destinoLat: destino_lat ?? null,
      destinoLng: destino_lng ?? null,
      destinoDireccion: destino_direccion ?? null,
      metodoPago: metodo_pago,
      estado: "BUSCANDO_CONDUCTOR",
    },
  })

  return NextResponse.json({
    id_solicitud: solicitud.id,
    estado: solicitud.estado,
  }, { status: 201 })
}
