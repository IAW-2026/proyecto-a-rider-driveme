import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

type Role = "pasajero" | "admin"

export async function getAuthenticatedUser() {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: Role } | undefined)?.role
  return { userId, role }
}

export async function requireRole(requiredRole: Role) {
  const { userId, role } = await getAuthenticatedUser()
  if (!userId) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  if (role !== requiredRole) return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) }
  return { userId, role }
}

export function requireM2MToken(req: Request) {
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  return null
}
