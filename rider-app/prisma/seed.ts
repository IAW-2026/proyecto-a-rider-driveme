import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TEST_EMAILS = ["valentina@test.com", "matias@test.com"]

// Coordenadas reales de Buenos Aires
const LUGARES = {
  palermo:      { lat: -34.5794, lng: -58.4228, dir: "Av. Santa Fe 3253, Palermo, CABA" },
  microcentro:  { lat: -34.6083, lng: -58.3712, dir: "Av. Corrientes 800, Microcentro, CABA" },
  sanTelmo:     { lat: -34.6217, lng: -58.3731, dir: "Defensa 1000, San Telmo, CABA" },
  belgrano:     { lat: -34.5594, lng: -58.4589, dir: "Av. Cabildo 2000, Belgrano, CABA" },
  recoleta:     { lat: -34.5874, lng: -58.3938, dir: "Av. del Libertador 1400, Recoleta, CABA" },
  caballito:    { lat: -34.6190, lng: -58.4386, dir: "Av. Rivadavia 5000, Caballito, CABA" },
  puertoMadero: { lat: -34.6155, lng: -58.3632, dir: "Av. Alicia Moreau de Justo 700, Puerto Madero, CABA" },
}

async function main() {
  // Borrar en orden de dependencia para ser idempotente
  await prisma.transaccion.deleteMany({
    where: { viaje: { solicitud: { pasajero: { email: { in: TEST_EMAILS } } } } },
  })
  await prisma.viaje.deleteMany({
    where: { solicitud: { pasajero: { email: { in: TEST_EMAILS } } } },
  })
  await prisma.solicitudDeViaje.deleteMany({
    where: { pasajero: { email: { in: TEST_EMAILS } } },
  })
  await prisma.pasajero.deleteMany({
    where: { email: { in: TEST_EMAILS } },
  })

  // --- Pasajeros ---
  const [valentina, matias] = await prisma.$transaction([
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_valentina",
        nombre: "Valentina Torres",
        email: "valentina@test.com",
        telefono: "+54 11 4567-8901",
        ratingPromedio: 4.8,
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_matias",
        nombre: "Matías Fernández",
        email: "matias@test.com",
        telefono: "+54 11 2345-6789",
        ratingPromedio: 3.2,
      },
    }),
  ])

  // --- Solicitudes sin viaje ---

  // 1. Esperando conductor (estado activo en el mapa)
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: valentina.id,
      origenLat: LUGARES.palermo.lat,
      origenLng: LUGARES.palermo.lng,
      origenDireccion: LUGARES.palermo.dir,
      destinoLat: LUGARES.microcentro.lat,
      destinoLng: LUGARES.microcentro.lng,
      destinoDireccion: LUGARES.microcentro.dir,
      precioEstimadoCents: 1800,
      metodoPago: "EFECTIVO",
      estado: "BUSCANDO_CONDUCTOR",
    },
  })

  // 2. Expiró sin que nadie aceptara (nadie aceptó en 2 min)
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: matias.id,
      origenLat: LUGARES.belgrano.lat,
      origenLng: LUGARES.belgrano.lng,
      origenDireccion: LUGARES.belgrano.dir,
      destinoLat: LUGARES.recoleta.lat,
      destinoLng: LUGARES.recoleta.lng,
      destinoDireccion: LUGARES.recoleta.dir,
      precioEstimadoCents: 2200,
      metodoPago: "TARJETA",
      estado: "EXPIRADA_SIN_ACEPTACION",
      comentarioExpiracion: "Esperé mucho tiempo y no apareció ningún conductor por la zona.",
    },
  })

  // 3. Cancelada por el pasajero antes de ser aceptada
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: valentina.id,
      origenLat: LUGARES.caballito.lat,
      origenLng: LUGARES.caballito.lng,
      origenDireccion: LUGARES.caballito.dir,
      destinoLat: LUGARES.sanTelmo.lat,
      destinoLng: LUGARES.sanTelmo.lng,
      destinoDireccion: LUGARES.sanTelmo.dir,
      precioEstimadoCents: 1500,
      metodoPago: "TARJETA",
      estado: "CANCELADA_POR_PASAJERO",
    },
  })

  // --- Solicitudes con viaje ---

  // 4. Conductor asignado, todavía no arrancó el viaje
  const sol4 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: matias.id,
      origenLat: LUGARES.recoleta.lat,
      origenLng: LUGARES.recoleta.lng,
      origenDireccion: LUGARES.recoleta.dir,
      destinoLat: LUGARES.puertoMadero.lat,
      destinoLng: LUGARES.puertoMadero.lng,
      destinoDireccion: LUGARES.puertoMadero.dir,
      precioEstimadoCents: 2500,
      metodoPago: "EFECTIVO",
      estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol4.id,
      idConductor: "conductor-mock-001",
      estadoActual: "ACEPTADO",
    },
  })

  // 5. Viaje en curso ahora mismo
  const sol5 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: valentina.id,
      origenLat: LUGARES.belgrano.lat,
      origenLng: LUGARES.belgrano.lng,
      origenDireccion: LUGARES.belgrano.dir,
      destinoLat: LUGARES.microcentro.lat,
      destinoLng: LUGARES.microcentro.lng,
      destinoDireccion: LUGARES.microcentro.dir,
      precioEstimadoCents: 3200,
      metodoPago: "TARJETA",
      estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol5.id,
      idConductor: "conductor-mock-002",
      latitudActual: -34.5900,
      longitudActual: -58.4100,
      estadoActual: "EN_CURSO",
    },
  })

  // 6. Conductor canceló después de aceptar
  const sol6 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: matias.id,
      origenLat: LUGARES.palermo.lat,
      origenLng: LUGARES.palermo.lng,
      origenDireccion: LUGARES.palermo.dir,
      destinoLat: LUGARES.caballito.lat,
      destinoLng: LUGARES.caballito.lng,
      destinoDireccion: LUGARES.caballito.dir,
      precioEstimadoCents: 1900,
      metodoPago: "EFECTIVO",
      estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol6.id,
      idConductor: "conductor-mock-003",
      estadoActual: "CANCELADO_POR_CONDUCTOR",
    },
  })

  // 7. Finalizado sin feedback (pasajero no calificó)
  const sol7 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: valentina.id,
      origenLat: LUGARES.sanTelmo.lat,
      origenLng: LUGARES.sanTelmo.lng,
      origenDireccion: LUGARES.sanTelmo.dir,
      destinoLat: LUGARES.belgrano.lat,
      destinoLng: LUGARES.belgrano.lng,
      destinoDireccion: LUGARES.belgrano.dir,
      precioEstimadoCents: 3800,
      metodoPago: "EFECTIVO",
      estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol7.id,
      idConductor: "conductor-mock-001",
      estadoActual: "FINALIZADO",
    },
  })

  // 8. Finalizado con feedback completo (5 estrellas + comentario)
  const sol8 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: valentina.id,
      origenLat: LUGARES.recoleta.lat,
      origenLng: LUGARES.recoleta.lng,
      origenDireccion: LUGARES.recoleta.dir,
      destinoLat: LUGARES.puertoMadero.lat,
      destinoLng: LUGARES.puertoMadero.lng,
      destinoDireccion: LUGARES.puertoMadero.dir,
      precioEstimadoCents: 2800,
      metodoPago: "TARJETA",
      estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol8.id,
      idConductor: "conductor-mock-002",
      estadoActual: "FINALIZADO",
      puntajeCalificacion: 5,
      comentarioCalificacion: "Excelente conductor, muy puntual y el auto estaba impecable.",
      idCalificacion: "cal_mock_001",
    },
  })

  // 9. Finalizado con feedback parcial (3 estrellas, sin comentario)
  const sol9 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: matias.id,
      origenLat: LUGARES.microcentro.lat,
      origenLng: LUGARES.microcentro.lng,
      origenDireccion: LUGARES.microcentro.dir,
      destinoLat: LUGARES.caballito.lat,
      destinoLng: LUGARES.caballito.lng,
      destinoDireccion: LUGARES.caballito.dir,
      precioEstimadoCents: 2100,
      metodoPago: "EFECTIVO",
      estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol9.id,
      idConductor: "conductor-mock-003",
      estadoActual: "FINALIZADO",
      puntajeCalificacion: 3,
      idCalificacion: "cal_mock_002",
    },
  })

  console.log("Seed completado — 9 solicitudes creadas:")
  console.log("  valentina@test.com:")
  console.log("    · BUSCANDO_CONDUCTOR (sin viaje)")
  console.log("    · CANCELADA_POR_PASAJERO (sin viaje)")
  console.log("    · ACEPTADA + viaje EN_CURSO")
  console.log("    · ACEPTADA + viaje FINALIZADO (sin feedback)")
  console.log("    · ACEPTADA + viaje FINALIZADO (5 ★ + comentario)")
  console.log("  matias@test.com:")
  console.log("    · EXPIRADA_SIN_ACEPTACION (sin viaje)")
  console.log("    · ACEPTADA + viaje ACEPTADO")
  console.log("    · ACEPTADA + viaje CANCELADO_POR_CONDUCTOR")
  console.log("    · ACEPTADA + viaje FINALIZADO (3 ★ sin comentario)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
