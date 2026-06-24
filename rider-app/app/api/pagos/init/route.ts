import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

/**
 * POST /api/pagos/init
 *
 * Rider llama a este endpoint después de crear una solicitud con MERCADO_PAGO.
 * Rider le pega a Payments App para crear la transacción y obtener el init_point
 * de Mercado Pago al que hay que redirigir al usuario.
 *
 * Body: { id_solicitud: string }
 * Response: { init_point: string } o { error: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(["rider", "admin"])
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { id_solicitud } = body

  if (!id_solicitud) {
    return NextResponse.json({ error: "Falta id_solicitud" }, { status: 400 })
  }

  // Verificar que la solicitud existe, es del usuario y está en PENDIENTE_PAGO
  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: auth.userId },
    select: { id: true, publicId: true },
  })
  if (!pasajero) {
    return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })
  }

  const solicitud = await prisma.solicitudDeViaje.findUnique({
    where: { id: id_solicitud },
    select: { id: true, estado: true, pasajeroId: true, precioEstimadoCents: true, metodoPago: true },
  })

  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }
  if (solicitud.pasajeroId !== pasajero.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  if (solicitud.estado !== "PENDIENTE_PAGO") {
    return NextResponse.json({ error: "La solicitud no está en estado PENDIENTE_PAGO" }, { status: 409 })
  }
  if (solicitud.metodoPago !== "MERCADO_PAGO") {
    return NextResponse.json({ error: "La solicitud no es de Mercado Pago" }, { status: 400 })
  }

  const paymentsUrl = process.env.PAYMENTS_APP_URL?.replace(/\/$/, "")
  if (!paymentsUrl) {
    return NextResponse.json(
      { error: "Payments App no configurada. Intentá de nuevo más tarde." },
      { status: 503 }
    )
  }

  const riderSecret = process.env.RIDER_SERVICE_SECRET
  if (!riderSecret) {
    return NextResponse.json({ error: "Configuración interna incompleta." }, { status: 500 })
  }

  const monto = solicitud.precioEstimadoCents ? solicitud.precioEstimadoCents / 100 : 0
  const idPasajero = pasajero.publicId ?? pasajero.id

  try {
    // Paso 1: Crear la transacción en Payments App
    // Nota: Payments espera id_viaje pero en el flujo MP el viaje no existe todavía.
    // Por eso mandamos id_solicitud en ese campo y lo acordamos con Payments App
    // (ver sección "Lo que hay que acordar con Payments" en RIDER-etapa3.md).
    const crearRes = await fetch(`${paymentsUrl}/api/pagos/transacciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${riderSecret}`,
      },
      body: JSON.stringify({
        id_solicitud,           // identificador acordado con Payments para el flujo MP
        id_pasajero: idPasajero,
        id_conductor: null,     // no hay conductor todavía
        metodo_pago: "MERCADO_PAGO",
        monto,
      }),
    })

    if (!crearRes.ok) {
      const err = await crearRes.text()
      console.error("Payments App error al crear transacción:", err)
      return NextResponse.json(
        { error: "No se pudo iniciar el pago. Intentá de nuevo en unos segundos." },
        { status: 502 }
      )
    }

    const { id_transaccion } = await crearRes.json()

    // Paso 2: Procesar la transacción (obtener init_point de MP)
    const procesarRes = await fetch(`${paymentsUrl}/api/pagos/transacciones`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${riderSecret}`,
      },
      body: JSON.stringify({ id_transaccion, id_solicitud }),
    })

    if (!procesarRes.ok) {
      const err = await procesarRes.text()
      console.error("Payments App error al procesar transacción:", err)
      return NextResponse.json(
        { error: "No se pudo generar el link de pago. Intentá de nuevo." },
        { status: 502 }
      )
    }

    const data = await procesarRes.json()

    if (!data.init_point) {
      return NextResponse.json(
        { error: "Payments App no devolvió el link de pago." },
        { status: 502 }
      )
    }

    return NextResponse.json({ init_point: data.init_point })
  } catch (err) {
    console.error("Error de conexión con Payments App:", err)
    return NextResponse.json(
      { error: "No se pudo conectar con el servicio de pagos. Revisá tu conexión." },
      { status: 503 }
    )
  }
}
