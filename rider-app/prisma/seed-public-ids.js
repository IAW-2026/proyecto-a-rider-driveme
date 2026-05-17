require('dotenv').config({ path: '.env.local' })
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

function generatePublicId(prefix, source) {
  const hash = crypto.createHash('sha256').update(source).digest('base64url')
  const short = hash.replace(/[-_]/g, '').slice(0, 12)
  return `${prefix}_${short}`
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const pasajeros = await prisma.pasajero.findMany({ where: { publicId: null } })
  let updated = 0
  for (const p of pasajeros) {
    const publicId = generatePublicId('pas', p.clerkId || p.id)
    await prisma.pasajero.update({ where: { id: p.id }, data: { publicId } })
    updated++
    console.log(`Updated ${p.id} -> ${publicId}`)
  }
  console.log(`Total updated: ${updated}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
