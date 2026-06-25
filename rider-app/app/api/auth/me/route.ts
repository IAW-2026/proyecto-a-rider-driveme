import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

export async function GET() {
  const u = await currentUser()
  if (!u) return NextResponse.json({ role: null })
  const role = (u.publicMetadata as any)?.role ?? null
  return NextResponse.json({ role })
}
