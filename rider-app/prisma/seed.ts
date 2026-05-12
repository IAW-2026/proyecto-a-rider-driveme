import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/prisma'

async function main() {
  console.log('Starting seed...')

  // Create sample passengers (skip duplicates)
  await prisma.pasajero.createMany({
    data: [
      {
        clerkId: 'seed_clerk_1',
        nombre: 'Martina Ejemplo',
        email: 'martina@example.com',
        telefono: '999-000-111',
        ratingPromedio: 4.5,
      },
      {
        clerkId: 'seed_clerk_2',
        nombre: 'Carlos Ejemplo',
        email: 'carlos@example.com',
        telefono: null,
        ratingPromedio: 5,
      },
    ],
    skipDuplicates: true,
  })

  const pasajero = await prisma.pasajero.findUnique({
    where: { clerkId: 'seed_clerk_1' },
  })

  if (pasajero) {
    // Create a sample solicitud if none exists recently
    const existing = await prisma.solicitudDeViaje.findFirst({
      where: { pasajeroId: pasajero.id },
      orderBy: { creadaEn: 'desc' },
    })

    if (!existing) {
      const solicitud = await prisma.solicitudDeViaje.create({
        data: {
          pasajeroId: pasajero.id,
          origenLat: -34.6037,
          origenLng: -58.3816,
          destinoLat: -34.6090,
          destinoLng: -58.3923,
          precioEstimadoCents: 1500,
          metodoPago: 'TARJETA',
        },
      })

      // Optionally create a viaje linked to the solicitud (simulate accepted)
      await prisma.viaje.create({
        data: {
          solicitudId: solicitud.id,
          idConductor: 'driver_seed_1',
          estadoActual: 'ACEPTADO',
        },
      })
    }
  }

  // Create a frequent address for passenger 1
  if (pasajero) {
    await prisma.direccionFrecuente.createMany({
      data: [
        {
          pasajeroId: pasajero.id,
          nombre: 'Casa',
          latitud: -34.6037,
          longitud: -58.3816,
        },
      ],
      skipDuplicates: true,
    })
  }

  console.log('Seed finished')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
