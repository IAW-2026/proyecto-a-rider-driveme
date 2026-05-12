import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

type Role = "rider" | "admin"

export async function getAuthenticatedUser() {
  const { userId } = await auth()
  if (!userId) return { userId: null as null, role: undefined }
  const user = await currentUser()
  const role = user?.publicMetadata?.role as Role | undefined
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
