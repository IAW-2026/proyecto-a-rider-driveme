import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { generatePublicId } from "@/lib/ids"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const pasajeros = await prisma.pasajero.findMany({ where: { publicId: null } })
  let updated = 0
  for (const p of pasajeros) {
    const publicId = generatePublicId("pas", p.clerkId ?? p.id)
    await prisma.pasajero.update({ where: { id: p.id }, data: { publicId } })
    updated++
    console.log(`Updated ${p.id} -> ${publicId}`)
  }
  console.log(`Total updated: ${updated}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(() => process.exit(0))
