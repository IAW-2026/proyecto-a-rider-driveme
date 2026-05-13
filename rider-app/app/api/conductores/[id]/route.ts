import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    // Intentar leer desde la BD si existe el modelo conductor, si no, devolver mock
    // (Driver App es la fuente de verdad; aquí devolvemos mock para la etapa 2)
    // Si en el futuro hay tabla 'conductor', reemplazar por consulta prisma.
    const mock = {
      id,
      nombre: "Carlos Gómez",
      fotoUrl: null,
      patente: "ABC-123",
      calificacionPromedio: 4.8,
      etaLlegadaMinutos: 5,
    }
    return NextResponse.json(mock)
  } catch (err) {
    return NextResponse.json({ error: "No se pudo obtener el conductor" }, { status: 500 })
  }
}
