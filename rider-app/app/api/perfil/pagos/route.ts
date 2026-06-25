import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePasajeroActivo } from "@/lib/requirePasajeroActivo"
import { z } from "zod"

const bodySchema = z.object({
  tieneMercadoPago: z.boolean(),
})

export async function PATCH(req: NextRequest) {
  const pasajero = await requirePasajeroActivo()

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { tieneMercadoPago } = parsed.data

  const updated = await prisma.pasajero.update({
    where: { id: pasajero.id },
    data: { tieneMercadoPago },
    select: { tieneMercadoPago: true }
  })

  return NextResponse.json({ tieneMercadoPago: updated.tieneMercadoPago }, { status: 200 })
}
