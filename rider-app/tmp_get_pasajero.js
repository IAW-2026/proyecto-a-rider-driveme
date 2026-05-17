const { PrismaClient } = require('@prisma/client')
;(async function(){
  const prisma = new PrismaClient()
  try {
    const row = await prisma.pasajero.findUnique({ where: { publicId: 'pas_Ntf7GZDH35v1' } })
    console.log(JSON.stringify(row, null, 2))
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()
