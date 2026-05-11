import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

  if (!role) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
}
