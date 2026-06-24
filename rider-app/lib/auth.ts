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
  const token =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  const validTokens = [
    process.env.DRIVER_SERVICE_SECRET,
    process.env.FEEDBACK_SERVICE_SECRET,
    process.env.CONTROL_PLANE_SECRET,
    process.env.ANALYTICS_DASHBOARD_SECRET,
    process.env.PAYMENTS_SERVICE_SECRET,
  ].filter(Boolean)

  if (token && validTokens.includes(token)) return null

  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}
