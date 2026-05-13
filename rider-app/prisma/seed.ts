import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

// Crear el cliente acá (no desde lib/prisma) para que DATABASE_URL ya esté cargado
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TEST_EMAILS = ["rider1@test.com", "rider2@test.com", "rider3@test.com"]

async function main() {
  // Borrar en orden de dependencia para ser idempotente
  await prisma.viaje.deleteMany({
    where: { solicitud: { pasajero: { email: { in: TEST_EMAILS } } } },
  })
  await prisma.solicitudDeViaje.deleteMany({
    where: { pasajero: { email: { in: TEST_EMAILS } } },
  })
  await prisma.pasajero.deleteMany({
    where: { email: { in: TEST_EMAILS } },
  })

  const [rider1, rider2, rider3] = await prisma.$transaction([
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_rider1",
        nombre: "Ana García",
        email: "rider1@test.com",
        telefono: "+54 11 1111-1111",
        ratingPromedio: 4.8,
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_rider2",
        nombre: "Bruno López",
        email: "rider2@test.com",
        telefono: "+54 11 2222-2222",
        ratingPromedio: 4.2,
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_rider3",
        nombre: "Carla Díaz",
        email: "rider3@test.com",
        telefono: "+54 11 3333-3333",
        ratingPromedio: 5.0,
      },
    }),
  ])

  // rider1: solicitud BUSCANDO_CONDUCTOR (sin viaje)
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: rider1.id,
      origenLat: -34.6037,
      origenLng: -58.3816,
      destinoLat: -34.6083,
      destinoLng: -58.3712,
      precioEstimadoCents: 1500,
      metodoPago: "EFECTIVO",
      estado: "BUSCANDO_CONDUCTOR",
    },
  })

  // rider1: solicitud CANCELADA_POR_PASAJERO
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: rider1.id,
      origenLat: -34.6037,
      origenLng: -58.3816,
      destinoLat: -34.6083,
      destinoLng: -58.3712,
      precioEstimadoCents: 1200,
      metodoPago: "TARJETA",
      estado: "CANCELADA_POR_PASAJERO",
    },
  })

  // rider2: solicitud ACEPTADA + viaje EN_CURSO
  const sol2 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: rider2.id,
      origenLat: -34.5953,
      origenLng: -58.3953,
      destinoLat: -34.6083,
      destinoLng: -58.3712,
      precioEstimadoCents: 2000,
      metodoPago: "EFECTIVO",
      estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol2.id,
      idConductor: "conductor-mock-001",
      estadoActual: "EN_CURSO",
    },
  })

  // rider3: solicitud ACEPTADA + viaje FINALIZADO
  const sol3 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: rider3.id,
      origenLat: -34.5881,
      origenLng: -58.4267,
      destinoLat: -34.6083,
      destinoLng: -58.3712,
      precioEstimadoCents: 2500,
      metodoPago: "TARJETA",
      estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol3.id,
      idConductor: "conductor-mock-001",
      estadoActual: "FINALIZADO",
    },
  })

  console.log("Seed completado")
  console.log("  rider1@test.com — BUSCANDO_CONDUCTOR y CANCELADA")
  console.log("  rider2@test.com — ACEPTADA + viaje EN_CURSO")
  console.log("  rider3@test.com — ACEPTADA + viaje FINALIZADO")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
