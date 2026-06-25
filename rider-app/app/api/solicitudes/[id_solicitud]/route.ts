import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { obtenerTransaccionViaje } from "@/lib/payments"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id_solicitud: string }> }
) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const { id_solicitud } = await params

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id: id_solicitud },
    include: { pasajero: { select: { id: true, publicId: true, clerkId: true } } },
  })

  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  if (auth.role !== "admin" && solicitud.pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos sobre esta solicitud" }, { status: 403 })
  }

  // Fallback: si notifyRider falló, consultamos el estado real a Payments App
  let estadoFinal = solicitud.estado
  if (solicitud.estado === "PENDIENTE_PAGO" && solicitud.metodoPago === "MERCADO_PAGO") {
    try {
      const txInfo = await obtenerTransaccionViaje(solicitud.id)
      if (txInfo && (txInfo.estado === "CAPTURED" || txInfo.estado === "FAILED")) {
        const nuevoEstado = txInfo.estado === "CAPTURED" ? "BUSCANDO_CONDUCTOR" : "PAGO_RECHAZADO"
        const updated = await prisma.solicitudDeViaje.updateMany({
          where: { id: solicitud.id, estado: "PENDIENTE_PAGO" },
          data: {
            estado: nuevoEstado,
            ...(nuevoEstado === "BUSCANDO_CONDUCTOR" ? { buscandoConductorDesde: new Date() } : {}),
          },
        })
        if (updated.count > 0) {
          estadoFinal = nuevoEstado
          const existente = await prisma.transaccion.findFirst({ where: { solicitudId: solicitud.id } })
          if (!existente) {
            await prisma.transaccion.create({
              data: {
                solicitudId: solicitud.id,
                idTransaccion: txInfo.idTransaccion,
                estado: txInfo.estado,
                monto: Math.round(txInfo.monto * 100),
              },
            })
          }
        }
      }
    } catch {
      // Si Payments App no está disponible, devolvemos el estado actual sin error
    }
  }

  return NextResponse.json({
    id_solicitud: solicitud.id,
    estado: estadoFinal,
    id_pasajero: solicitud.pasajero.publicId ?? solicitud.pasajero.id,
    origen: { direccion: solicitud.origenDireccion, lat: solicitud.origenLat, lng: solicitud.origenLng },
    destino: { direccion: solicitud.destinoDireccion, lat: solicitud.destinoLat, lng: solicitud.destinoLng },
    precio_estimado: solicitud.precioEstimadoCents != null ? solicitud.precioEstimadoCents / 100 : null,
    metodo_pago: solicitud.metodoPago,
    creada_en: solicitud.creadaEn,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id_solicitud: string }> }
) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const { id_solicitud } = await params
  const MOTIVOS_VALIDOS = ["DESISTIO", "TIEMPO_EXCEDIDO", "ERROR_ORIGEN_DESTINO"]

  const body = await req.json()
  const { estado, motivo, comentario } = body

  if (motivo && !MOTIVOS_VALIDOS.includes(motivo)) {
    return NextResponse.json({ error: "Motivo inválido" }, { status: 400 })
  }

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id: id_solicitud },
    include: { pasajero: true },
  })

  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  if (auth.role !== "admin" && solicitud.pasajero.clerkId !== auth.userId) {
    return NextResponse.json({ error: "Sin permisos sobre esta solicitud" }, { status: 403 })
  }

  // Guardar comentario en solicitud ya expirada
  if (!estado && comentario !== undefined) {
    if (solicitud.estado !== "EXPIRADA_SIN_ACEPTACION") {
      return NextResponse.json({ error: "Solo se puede comentar una solicitud expirada" }, { status: 409 })
    }
    await prisma.solicitudDeViaje.update({
      where: { id: id_solicitud },
      data: { comentarioExpiracion: comentario },
    })
    return NextResponse.json({ id_solicitud: solicitud.id, estado: solicitud.estado })
  }

  // Cambiar estado (cancelación, expiración o pago rechazado)
  if (estado !== "CANCELADA_POR_PASAJERO" && estado !== "EXPIRADA_SIN_ACEPTACION" && estado !== "PAGO_RECHAZADO") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  // PAGO_RECHAZADO: solo válido cuando está en PENDIENTE_PAGO
  if (estado === "PAGO_RECHAZADO") {
    if (solicitud.estado !== "PENDIENTE_PAGO") {
      return NextResponse.json({ error: "La solicitud no está en estado PENDIENTE_PAGO" }, { status: 409 })
    }
    const actualizada = await prisma.solicitudDeViaje.update({
      where: { id: id_solicitud },
      data: { estado: "PAGO_RECHAZADO" },
    })
    return NextResponse.json({ id_solicitud: actualizada.id, estado: actualizada.estado })
  }

  if (solicitud.estado !== "BUSCANDO_CONDUCTOR") {
    return NextResponse.json({ error: "La solicitud ya no puede modificarse" }, { status: 409 })
  }

  const actualizada = await prisma.solicitudDeViaje.update({
    where: { id: id_solicitud },
    data: { estado },
  })

  return NextResponse.json({
    id_solicitud: actualizada.id,
    estado: actualizada.estado,
  })
}
