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

export async function requireRole(requiredRole: Role | Role[]) {
  const { userId, role } = await getAuthenticatedUser()
  if (!userId) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  if (!role || !allowed.includes(role)) return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) }
  return { userId, role }
}

export function requireM2MToken(req: Request) {
  const apiKey = req.headers.get("x-api-key")
  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  // Accept either x-api-key or Authorization: Bearer <token>
  // Valid tokens: INTERNAL_API_KEY (recommended) and optional FEEDBACK_APP_TOKEN
  if (apiKey && apiKey === process.env.INTERNAL_API_KEY) return null
  if (authHeader && (authHeader === process.env.INTERNAL_API_KEY || authHeader === process.env.FEEDBACK_APP_TOKEN)) return null

  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}
