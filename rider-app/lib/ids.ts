import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export function generatePublicId(prefix: "pas" | "cond", source: string) {
  const hash = crypto.createHash("sha256").update(source).digest("base64url")
  const short = hash.replace(/[-_]/g, "").slice(0, 12)
  return `${prefix}_${short}`
}

export async function resolvePublicIdToInternalId(publicId: string) {
  if (!publicId) return null
  const [prefix] = publicId.split("_")
  if (prefix === "pas") {
    const p = await prisma.pasajero.findUnique({ where: { publicId } })
    return p?.id ?? null
  }
  // extend for conductores if model exists
  return null
}
