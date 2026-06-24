import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireRole, requireM2MToken } from "@/lib/auth"
import { getActiveSolicitudByPasajeroId } from "@/lib/activeSolicitud"
import { z } from "zod"

const solicitudSchema = z.object({
  origen_lat: z.number(),
  origen_lng: z.number(),
  origen_direccion: z.string().optional(),
  destino_lat: z.number(),
  destino_lng: z.number(),
  destino_direccion: z.string().min(1),
  metodo_pago: z.enum(["EFECTIVO", "MERCADO_PAGO"]),
  precio_estimado: z.number().positive().nullable().optional(),
})

// Driver App consulta solicitudes disponibles; riders ven las propias; admin ve todas
export async function GET(req: NextRequest) {
  const m2mError = requireM2MToken(req)

  // Path para riders y admins (Clerk auth)
  if (m2mError) {
    const auth = await requireRole(["rider", "admin"])
    if ("error" in auth) return auth.error

    const { searchParams } = new URL(req.url)
    const estado = searchParams.get("estado") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")))
    const skip = (page - 1) * limit

    const where: Prisma.SolicitudDeViajeWhereInput = {}
    if (estado) where.estado = estado as Prisma.EnumEstadoSolicitudFilter["equals"]

    if (auth.role === "rider") {
      const pasajero = await prisma.pasajero.findUnique({
        where: { clerkId: auth.userId },
        select: { id: true },
      })
      if (!pasajero) return NextResponse.json({ data: [], pagination: { page, limit, total: 0 } })
      where.pasajeroId = pasajero.id
    }

    const [solicitudes, total] = await Promise.all([
      prisma.solicitudDeViaje.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadaEn: "desc" },
        select: {
          id: true,
          estado: true,
          metodoPago: true,
          precioEstimadoCents: true,
          origenDireccion: true,
          origenLat: true,
          origenLng: true,
          destinoDireccion: true,
          destinoLat: true,
          destinoLng: true,
          creadaEn: true,
        },
      }),
      prisma.solicitudDeViaje.count({ where }),
    ])

    return NextResponse.json({
      data: solicitudes.map((s) => ({
        id_solicitud: s.id,
        estado: s.estado,
        metodo_pago: s.metodoPago,
        precio_estimado: s.precioEstimadoCents != null ? s.precioEstimadoCents / 100 : null,
        origen: { direccion: s.origenDireccion, lat: s.origenLat, lng: s.origenLng },
        destino: { direccion: s.destinoDireccion, lat: s.destinoLat, lng: s.destinoLng },
        creada_en: s.creadaEn,
      })),
      pagination: { page, limit, total },
    })
  }

  // Path M2M — Driver App

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado") ?? "BUSCANDO_CONDUCTOR"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100)
  const offset = (page - 1) * limit
  const latitud = searchParams.get("latitud") ? parseFloat(searchParams.get("latitud")!) : null
  const longitud = searchParams.get("longitud") ? parseFloat(searchParams.get("longitud")!) : null
  const radius = searchParams.get("radius") ? parseInt(searchParams.get("radius")!) : null
  const orden = searchParams.get("orden") ?? "creada_en" // "distancia" o "creada_en"

  // Función para calcular distancia Haversine (en metros)
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000 // radio de la tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Expirar solicitudes viejas antes de responder (lazy expiration global)
  await prisma.solicitudDeViaje.updateMany({
    where: {
      estado: "BUSCANDO_CONDUCTOR",
      creadaEn: { lt: new Date(Date.now() - 2 * 60 * 1000) },
    },
    data: { estado: "EXPIRADA_SIN_ACEPTACION" },
  })

  let solicitudes = await prisma.solicitudDeViaje.findMany({
    where: { estado: estado as never },
    include: { pasajero: { select: { id: true, publicId: true, ratingPromedio: true, comentarioPromedio: true } } },
  })

  // Filtrar por distancia si se proporciona ubicación
  if (latitud !== null && longitud !== null && radius !== null) {
    solicitudes = solicitudes.filter((s) => {
      const distance = calcularDistancia(latitud, longitud, s.origenLat, s.origenLng)
      return distance <= radius
    })
  }

  // Mapear respuesta con distancia y ETA
  let solicitudesFormateadas = solicitudes.map((s) => {
    const distancia = latitud !== null && longitud !== null ? calcularDistancia(latitud, longitud, s.origenLat, s.origenLng) : 0
    const etaMin = Math.ceil(distancia / 500) // aproximadamente 30 km/h = 500 m/min

    return {
      id_solicitud: s.id,
      id_pasajero: s.pasajero.publicId ?? s.pasajeroId,
      pasajero: {
        id_pasajero_public: s.pasajero.publicId ?? null,
        rating_promedio: s.pasajero.ratingPromedio ?? null,
        comentario_promedio: s.pasajero.comentarioPromedio ?? null,
      },
      origen: { direccion: s.origenDireccion, lat: s.origenLat, lng: s.origenLng },
      destino: { direccion: s.destinoDireccion, lat: s.destinoLat, lng: s.destinoLng },
      precio_estimado: s.precioEstimadoCents != null ? s.precioEstimadoCents / 100 : null,
      metodo_pago: s.metodoPago,
      created_at: s.creadaEn,
      distance_m: latitud !== null && longitud !== null ? Math.round(distancia) : 0,
      eta_min: etaMin,
    }
  })

  if (orden === "distancia" && latitud !== null && longitud !== null) {
    solicitudesFormateadas.sort((a, b) => a.distance_m - b.distance_m)
  } else {
    solicitudesFormateadas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  // Aplicar paginación
  const total = solicitudesFormateadas.length
  const paginated = solicitudesFormateadas.slice(offset, offset + limit)

  return NextResponse.json({
    data: paginated,
    pagination: { page, limit, total },
  })
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

  const { origen_lat, origen_lng, origen_direccion, destino_lat, destino_lng, destino_direccion, metodo_pago, precio_estimado } = parsed.data

  // Guard final: evita crear otra solicitud si ya hay un viaje activo.
  const activeSolicitud = await getActiveSolicitudByPasajeroId(pasajero.id)
  if (activeSolicitud) {
    return NextResponse.json(
      {
        error: "Ya tenes un viaje activo.",
        redirectTo: "/viaje-activo",
        id_solicitud: activeSolicitud.id,
      },
      { status: 409 }
    )
  }

  const solicitud = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: pasajero.id,
      origenLat: origen_lat,
      origenLng: origen_lng,
      origenDireccion: origen_direccion ?? null,
      destinoLat: destino_lat,
      destinoLng: destino_lng,
      destinoDireccion: destino_direccion,
      precioEstimadoCents: precio_estimado != null ? Math.round(precio_estimado * 100) : null,
      metodoPago: metodo_pago,
      estado: "BUSCANDO_CONDUCTOR",
    },
  })

  return NextResponse.json({
    id_solicitud: solicitud.id,
    estado: solicitud.estado,
  }, { status: 201 })
}
