import { NextRequest, NextResponse } from "next/server"
import { searchAddressSuggestions } from "@/lib/geocoding"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  if (!q) return NextResponse.json([], { status: 200 })
  try {
    const suggestions = await searchAddressSuggestions(q)
    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
