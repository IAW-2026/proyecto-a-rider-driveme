import { NextRequest, NextResponse } from "next/server"
import { getConductorById } from "@/lib/conductores"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const conductor = await getConductorById(id)
    return NextResponse.json(conductor)
  } catch (err) {
    return NextResponse.json({ error: "No se pudo obtener el conductor" }, { status: 500 })
  }
}
