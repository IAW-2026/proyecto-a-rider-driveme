import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Coordenadas reales de Buenos Aires
const LUGARES = {
  palermo:      { lat: -34.5794, lng: -58.4228, dir: "Av. Santa Fe 3253, Palermo, CABA" },
  microcentro:  { lat: -34.6083, lng: -58.3712, dir: "Av. Corrientes 800, Microcentro, CABA" },
  sanTelmo:     { lat: -34.6217, lng: -58.3731, dir: "Defensa 1000, San Telmo, CABA" },
  belgrano:     { lat: -34.5594, lng: -58.4589, dir: "Av. Cabildo 2000, Belgrano, CABA" },
  recoleta:     { lat: -34.5874, lng: -58.3938, dir: "Av. del Libertador 1400, Recoleta, CABA" },
  caballito:    { lat: -34.6190, lng: -58.4386, dir: "Av. Rivadavia 5000, Caballito, CABA" },
  puertoMadero: { lat: -34.6155, lng: -58.3632, dir: "Av. Alicia Moreau de Justo 700, Puerto Madero, CABA" },
  nunez:        { lat: -34.5454, lng: -58.4619, dir: "Av. del Libertador 7500, Núñez, CABA" },
  villa_crespo: { lat: -34.5971, lng: -58.4447, dir: "Av. Corrientes 4800, Villa Crespo, CABA" },
  almagro:      { lat: -34.6069, lng: -58.4261, dir: "Av. Rivadavia 3800, Almagro, CABA" },
}

async function main() {
  console.log("Limpiando la base de datos...")

  // Wipe global en orden de dependencia
  await prisma.transaccion.deleteMany({})
  await prisma.viaje.deleteMany({})
  await prisma.solicitudDeViaje.deleteMany({})
  await prisma.direccionFrecuente.deleteMany({})
  await prisma.pasajero.deleteMany({})

  console.log("BD limpia. Creando seed...")

  // --- 7 Pasajeros (5 seed + 2 cuentas reales de demo) ---
  const [valentina, matias, lucia, nicolas, camila, probandoRider, adminDemo] = await prisma.$transaction([
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_valentina",
        nombre: "Valentina Torres",
        email: "valentina@test.com",
        telefono: "+54 11 4567-8901",
        ratingPromedio: 4.8,
        comentarioPromedio: "Siempre puntual y muy educada.",
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_matias",
        nombre: "Matías Fernández",
        email: "matias@test.com",
        telefono: "+54 11 2345-6789",
        ratingPromedio: 3.2,
        comentarioPromedio: "A veces tarda en bajar al auto.",
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_lucia",
        nombre: "Lucía Ramírez",
        email: "lucia@test.com",
        telefono: "+54 11 6789-0123",
        ratingPromedio: 4.5,
        comentarioPromedio: "Muy buena pasajera, recomendada.",
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_nicolas",
        nombre: "Nicolás Sánchez",
        email: "nicolas@test.com",
        telefono: "+54 11 8901-2345",
        ratingPromedio: 2.1,
        comentarioPromedio: "Canceló varias veces sin aviso.",
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "seed_clerk_camila",
        nombre: "Camila Gómez",
        email: "camila@test.com",
        telefono: "+54 11 3456-7890",
        ratingPromedio: 4.9,
        comentarioPromedio: "Excelente pasajera, 10 puntos.",
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "user_3EXjOzl35Xld1lPkWKehRv6GHLB",
        nombre: "Prueba Rider",
        email: "rider+clerktest@iaw.com",
        telefono: "+54 11 9999-0000",
        ratingPromedio: 4.6,
        comentarioPromedio: "Buen pasajero, siempre puntual.",
      },
    }),
    prisma.pasajero.create({
      data: {
        clerkId: "user_3EXjUXxK79Ef61SvyVy3FgxhvKY",
        nombre: "Admin Demo",
        email: "admin+clerktest@iaw.com",
        telefono: "+54 11 1111-2222",
        ratingPromedio: 3.7,
        comentarioPromedio: "Pasajero correcto, ocasionalmente impuntual.",
      },
    }),
  ])

  // --- Direcciones frecuentes ---
  await prisma.direccionFrecuente.createMany({
    data: [
      // Prueba Rider (cuenta real de demo)
      { pasajeroId: probandoRider.id, nombre: "Casa", direccion: LUGARES.palermo.dir, latitud: LUGARES.palermo.lat, longitud: LUGARES.palermo.lng },
      { pasajeroId: probandoRider.id, nombre: "Trabajo", direccion: LUGARES.microcentro.dir, latitud: LUGARES.microcentro.lat, longitud: LUGARES.microcentro.lng },
      { pasajeroId: probandoRider.id, nombre: "Gym", direccion: LUGARES.recoleta.dir, latitud: LUGARES.recoleta.lat, longitud: LUGARES.recoleta.lng },
      // Admin Demo (cuenta real de demo)
      { pasajeroId: adminDemo.id, nombre: "Casa", direccion: LUGARES.belgrano.dir, latitud: LUGARES.belgrano.lat, longitud: LUGARES.belgrano.lng },
      { pasajeroId: adminDemo.id, nombre: "Trabajo", direccion: LUGARES.microcentro.dir, latitud: LUGARES.microcentro.lat, longitud: LUGARES.microcentro.lng },
      // Valentina
      { pasajeroId: valentina.id, nombre: "Casa", direccion: LUGARES.palermo.dir, latitud: LUGARES.palermo.lat, longitud: LUGARES.palermo.lng },
      { pasajeroId: valentina.id, nombre: "Trabajo", direccion: LUGARES.microcentro.dir, latitud: LUGARES.microcentro.lat, longitud: LUGARES.microcentro.lng },
      { pasajeroId: valentina.id, nombre: "Gym", direccion: LUGARES.recoleta.dir, latitud: LUGARES.recoleta.lat, longitud: LUGARES.recoleta.lng },
      // Matías
      { pasajeroId: matias.id, nombre: "Casa", direccion: LUGARES.belgrano.dir, latitud: LUGARES.belgrano.lat, longitud: LUGARES.belgrano.lng },
      { pasajeroId: matias.id, nombre: "Facultad", direccion: LUGARES.caballito.dir, latitud: LUGARES.caballito.lat, longitud: LUGARES.caballito.lng },
      // Lucía
      { pasajeroId: lucia.id, nombre: "Casa", direccion: LUGARES.nunez.dir, latitud: LUGARES.nunez.lat, longitud: LUGARES.nunez.lng },
      { pasajeroId: lucia.id, nombre: "Trabajo", direccion: LUGARES.puertoMadero.dir, latitud: LUGARES.puertoMadero.lat, longitud: LUGARES.puertoMadero.lng },
      { pasajeroId: lucia.id, nombre: "Club", direccion: LUGARES.sanTelmo.dir, latitud: LUGARES.sanTelmo.lat, longitud: LUGARES.sanTelmo.lng },
      // Nicolás
      { pasajeroId: nicolas.id, nombre: "Casa", direccion: LUGARES.villa_crespo.dir, latitud: LUGARES.villa_crespo.lat, longitud: LUGARES.villa_crespo.lng },
      { pasajeroId: nicolas.id, nombre: "Bar", direccion: LUGARES.palermo.dir, latitud: LUGARES.palermo.lat, longitud: LUGARES.palermo.lng },
      // Camila
      { pasajeroId: camila.id, nombre: "Casa", direccion: LUGARES.almagro.dir, latitud: LUGARES.almagro.lat, longitud: LUGARES.almagro.lng },
      { pasajeroId: camila.id, nombre: "Trabajo", direccion: LUGARES.microcentro.dir, latitud: LUGARES.microcentro.lat, longitud: LUGARES.microcentro.lng },
    ],
  })

  // --- Solicitudes ---

  // 1. Buscando conductor (activo)
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: valentina.id,
      origenLat: LUGARES.palermo.lat, origenLng: LUGARES.palermo.lng, origenDireccion: LUGARES.palermo.dir,
      destinoLat: LUGARES.microcentro.lat, destinoLng: LUGARES.microcentro.lng, destinoDireccion: LUGARES.microcentro.dir,
      precioEstimadoCents: 1800, metodoPago: "EFECTIVO", estado: "BUSCANDO_CONDUCTOR",
    },
  })

  // 2. Expirada
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: matias.id,
      origenLat: LUGARES.belgrano.lat, origenLng: LUGARES.belgrano.lng, origenDireccion: LUGARES.belgrano.dir,
      destinoLat: LUGARES.recoleta.lat, destinoLng: LUGARES.recoleta.lng, destinoDireccion: LUGARES.recoleta.dir,
      precioEstimadoCents: 2200, metodoPago: "MERCADO_PAGO", estado: "EXPIRADA_SIN_ACEPTACION",
      comentarioExpiracion: "Esperé mucho tiempo y no apareció ningún conductor.",
    },
  })

  // 3. Cancelada por pasajero
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: nicolas.id,
      origenLat: LUGARES.villa_crespo.lat, origenLng: LUGARES.villa_crespo.lng, origenDireccion: LUGARES.villa_crespo.dir,
      destinoLat: LUGARES.sanTelmo.lat, destinoLng: LUGARES.sanTelmo.lng, destinoDireccion: LUGARES.sanTelmo.dir,
      precioEstimadoCents: 1500, metodoPago: "MERCADO_PAGO", estado: "CANCELADA_POR_PASAJERO",
    },
  })

  // 4. Aceptada + viaje ACEPTADO
  const sol4 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: matias.id,
      origenLat: LUGARES.recoleta.lat, origenLng: LUGARES.recoleta.lng, origenDireccion: LUGARES.recoleta.dir,
      destinoLat: LUGARES.puertoMadero.lat, destinoLng: LUGARES.puertoMadero.lng, destinoDireccion: LUGARES.puertoMadero.dir,
      precioEstimadoCents: 2500, metodoPago: "EFECTIVO", estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: { solicitudId: sol4.id, idConductor: "conductor-mock-001", estadoActual: "ACEPTADO" },
  })

  // 5. Aceptada + viaje EN_CURSO
  const sol5 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: lucia.id,
      origenLat: LUGARES.nunez.lat, origenLng: LUGARES.nunez.lng, origenDireccion: LUGARES.nunez.dir,
      destinoLat: LUGARES.microcentro.lat, destinoLng: LUGARES.microcentro.lng, destinoDireccion: LUGARES.microcentro.dir,
      precioEstimadoCents: 3200, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol5.id, idConductor: "conductor-mock-002",
      latitudActual: -34.5900, longitudActual: -58.4100, estadoActual: "EN_CURSO",
    },
  })

  // 6. Cancelado por conductor
  const sol6 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: nicolas.id,
      origenLat: LUGARES.almagro.lat, origenLng: LUGARES.almagro.lng, origenDireccion: LUGARES.almagro.dir,
      destinoLat: LUGARES.caballito.lat, destinoLng: LUGARES.caballito.lng, destinoDireccion: LUGARES.caballito.dir,
      precioEstimadoCents: 1900, metodoPago: "EFECTIVO", estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: { solicitudId: sol6.id, idConductor: "conductor-mock-003", estadoActual: "CANCELADO_POR_CONDUCTOR" },
  })

  // 7. Finalizado sin feedback
  const sol7 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: camila.id,
      origenLat: LUGARES.sanTelmo.lat, origenLng: LUGARES.sanTelmo.lng, origenDireccion: LUGARES.sanTelmo.dir,
      destinoLat: LUGARES.belgrano.lat, destinoLng: LUGARES.belgrano.lng, destinoDireccion: LUGARES.belgrano.dir,
      precioEstimadoCents: 3800, metodoPago: "EFECTIVO", estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: { solicitudId: sol7.id, idConductor: "conductor-mock-001", estadoActual: "FINALIZADO", puntajeCalificacion: 5, idCalificacion: "cal_mock_005", comentarioCalificacion: "Todo perfecto, muy buen viaje." },
  })

  // 8. Finalizado con 5 estrellas + comentario
  const sol8 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: valentina.id,
      origenLat: LUGARES.recoleta.lat, origenLng: LUGARES.recoleta.lng, origenDireccion: LUGARES.recoleta.dir,
      destinoLat: LUGARES.puertoMadero.lat, destinoLng: LUGARES.puertoMadero.lng, destinoDireccion: LUGARES.puertoMadero.dir,
      precioEstimadoCents: 2800, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol8.id, idConductor: "conductor-mock-002", estadoActual: "FINALIZADO",
      puntajeCalificacion: 5, idCalificacion: "cal_mock_001",
      comentarioCalificacion: "Excelente conductor, muy puntual y el auto estaba impecable.",
    },
  })

  // 9. Finalizado con 3 estrellas sin comentario
  const sol9 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: matias.id,
      origenLat: LUGARES.microcentro.lat, origenLng: LUGARES.microcentro.lng, origenDireccion: LUGARES.microcentro.dir,
      destinoLat: LUGARES.caballito.lat, destinoLng: LUGARES.caballito.lng, destinoDireccion: LUGARES.caballito.dir,
      precioEstimadoCents: 2100, metodoPago: "EFECTIVO", estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol9.id, idConductor: "conductor-mock-003", estadoActual: "FINALIZADO",
      puntajeCalificacion: 3, idCalificacion: "cal_mock_002",
    },
  })

  // 10. Segunda solicitud buscando para lucía
  await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: lucia.id,
      origenLat: LUGARES.puertoMadero.lat, origenLng: LUGARES.puertoMadero.lng, origenDireccion: LUGARES.puertoMadero.dir,
      destinoLat: LUGARES.nunez.lat, destinoLng: LUGARES.nunez.lng, destinoDireccion: LUGARES.nunez.dir,
      precioEstimadoCents: 4100, metodoPago: "MERCADO_PAGO", estado: "EXPIRADA_SIN_ACEPTACION",
      comentarioExpiracion: "No hubo conductores disponibles en la zona.",
    },
  })

  // 11. Camila — otra finalizada con 4 estrellas
  const sol11 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: camila.id,
      origenLat: LUGARES.almagro.lat, origenLng: LUGARES.almagro.lng, origenDireccion: LUGARES.almagro.dir,
      destinoLat: LUGARES.palermo.lat, destinoLng: LUGARES.palermo.lng, destinoDireccion: LUGARES.palermo.dir,
      precioEstimadoCents: 1600, metodoPago: "EFECTIVO", estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol11.id, idConductor: "conductor-mock-001", estadoActual: "FINALIZADO",
      puntajeCalificacion: 4, idCalificacion: "cal_mock_003",
      comentarioCalificacion: "Muy buen viaje, conductor amable.",
    },
  })

  // 12. Nicolás — finalizado con 1 estrella
  const sol12 = await prisma.solicitudDeViaje.create({
    data: {
      pasajeroId: nicolas.id,
      origenLat: LUGARES.caballito.lat, origenLng: LUGARES.caballito.lng, origenDireccion: LUGARES.caballito.dir,
      destinoLat: LUGARES.microcentro.lat, destinoLng: LUGARES.microcentro.lng, destinoDireccion: LUGARES.microcentro.dir,
      precioEstimadoCents: 2300, metodoPago: "EFECTIVO", estado: "ACEPTADA",
    },
  })
  await prisma.viaje.create({
    data: {
      solicitudId: sol12.id, idConductor: "conductor-mock-002", estadoActual: "FINALIZADO",
      puntajeCalificacion: 1, idCalificacion: "cal_mock_004",
      comentarioCalificacion: "Tardó muchísimo y el auto estaba sucio.",
    },
  })

  // --- Admin Demo: 3 viajes ---
  const adSol1 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: adminDemo.id, origenLat: LUGARES.belgrano.lat, origenLng: LUGARES.belgrano.lng, origenDireccion: LUGARES.belgrano.dir, destinoLat: LUGARES.microcentro.lat, destinoLng: LUGARES.microcentro.lng, destinoDireccion: LUGARES.microcentro.dir, precioEstimadoCents: 2100, metodoPago: "EFECTIVO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: adSol1.id, idConductor: "conductor-mock-001", estadoActual: "FINALIZADO", puntajeCalificacion: 4, idCalificacion: "cal_ad_001", comentarioCalificacion: "Pasajero tranquilo." } })

  const adSol2 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: adminDemo.id, origenLat: LUGARES.microcentro.lat, origenLng: LUGARES.microcentro.lng, origenDireccion: LUGARES.microcentro.dir, destinoLat: LUGARES.palermo.lat, destinoLng: LUGARES.palermo.lng, destinoDireccion: LUGARES.palermo.dir, precioEstimadoCents: 1700, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: adSol2.id, idConductor: "conductor-mock-002", estadoActual: "FINALIZADO", puntajeCalificacion: 3, idCalificacion: "cal_ad_002" } })

  await prisma.solicitudDeViaje.create({
    data: { pasajeroId: adminDemo.id, origenLat: LUGARES.recoleta.lat, origenLng: LUGARES.recoleta.lng, origenDireccion: LUGARES.recoleta.dir, destinoLat: LUGARES.sanTelmo.lat, destinoLng: LUGARES.sanTelmo.lng, destinoDireccion: LUGARES.sanTelmo.dir, precioEstimadoCents: 2800, metodoPago: "EFECTIVO", estado: "CANCELADA_POR_PASAJERO" },
  })

  // --- Prueba Rider: 13 viajes para demostrar paginación (LIMIT=8 → 2 páginas) ---

  // 5 estrellas + comentario
  const prSol1 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.palermo.lat, origenLng: LUGARES.palermo.lng, origenDireccion: LUGARES.palermo.dir, destinoLat: LUGARES.microcentro.lat, destinoLng: LUGARES.microcentro.lng, destinoDireccion: LUGARES.microcentro.dir, precioEstimadoCents: 1800, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol1.id, idConductor: "conductor-mock-001", estadoActual: "FINALIZADO", puntajeCalificacion: 5, idCalificacion: "cal_pr_001", comentarioCalificacion: "Excelente conductor, muy puntual." } })

  // 4 estrellas
  const prSol2 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.recoleta.lat, origenLng: LUGARES.recoleta.lng, origenDireccion: LUGARES.recoleta.dir, destinoLat: LUGARES.puertoMadero.lat, destinoLng: LUGARES.puertoMadero.lng, destinoDireccion: LUGARES.puertoMadero.dir, precioEstimadoCents: 2200, metodoPago: "EFECTIVO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol2.id, idConductor: "conductor-mock-002", estadoActual: "FINALIZADO", puntajeCalificacion: 4, idCalificacion: "cal_pr_002", comentarioCalificacion: "Buen viaje, todo en orden." } })

  // Cancelada por pasajero
  await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.belgrano.lat, origenLng: LUGARES.belgrano.lng, origenDireccion: LUGARES.belgrano.dir, destinoLat: LUGARES.sanTelmo.lat, destinoLng: LUGARES.sanTelmo.lng, destinoDireccion: LUGARES.sanTelmo.dir, precioEstimadoCents: 3100, metodoPago: "EFECTIVO", estado: "CANCELADA_POR_PASAJERO" },
  })

  // Expirada
  await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.caballito.lat, origenLng: LUGARES.caballito.lng, origenDireccion: LUGARES.caballito.dir, destinoLat: LUGARES.nunez.lat, destinoLng: LUGARES.nunez.lng, destinoDireccion: LUGARES.nunez.dir, precioEstimadoCents: 2700, metodoPago: "MERCADO_PAGO", estado: "EXPIRADA_SIN_ACEPTACION", comentarioExpiracion: "No hubo conductores disponibles." },
  })

  // 3 estrellas sin comentario
  const prSol5 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.microcentro.lat, origenLng: LUGARES.microcentro.lng, origenDireccion: LUGARES.microcentro.dir, destinoLat: LUGARES.almagro.lat, destinoLng: LUGARES.almagro.lng, destinoDireccion: LUGARES.almagro.dir, precioEstimadoCents: 1500, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol5.id, idConductor: "conductor-mock-003", estadoActual: "FINALIZADO", puntajeCalificacion: 3, idCalificacion: "cal_pr_003" } })

  // Cancelado por conductor
  const prSol6 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.nunez.lat, origenLng: LUGARES.nunez.lng, origenDireccion: LUGARES.nunez.dir, destinoLat: LUGARES.caballito.lat, destinoLng: LUGARES.caballito.lng, destinoDireccion: LUGARES.caballito.dir, precioEstimadoCents: 3400, metodoPago: "EFECTIVO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol6.id, idConductor: "conductor-mock-001", estadoActual: "CANCELADO_POR_CONDUCTOR" } })

  // 5 estrellas
  const prSol7 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.sanTelmo.lat, origenLng: LUGARES.sanTelmo.lng, origenDireccion: LUGARES.sanTelmo.dir, destinoLat: LUGARES.belgrano.lat, destinoLng: LUGARES.belgrano.lng, destinoDireccion: LUGARES.belgrano.dir, precioEstimadoCents: 4200, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol7.id, idConductor: "conductor-mock-002", estadoActual: "FINALIZADO", puntajeCalificacion: 5, idCalificacion: "cal_pr_004", comentarioCalificacion: "Perfecto, muy buena experiencia." } })

  // Finalizado sin calificación
  const prSol8 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.villa_crespo.lat, origenLng: LUGARES.villa_crespo.lng, origenDireccion: LUGARES.villa_crespo.dir, destinoLat: LUGARES.puertoMadero.lat, destinoLng: LUGARES.puertoMadero.lng, destinoDireccion: LUGARES.puertoMadero.dir, precioEstimadoCents: 2900, metodoPago: "EFECTIVO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol8.id, idConductor: "conductor-mock-003", estadoActual: "FINALIZADO", puntajeCalificacion: 4, idCalificacion: "cal_pr_007", comentarioCalificacion: "Buen servicio, llegó a tiempo." } })

  // 2 estrellas + comentario negativo
  const prSol9 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.almagro.lat, origenLng: LUGARES.almagro.lng, origenDireccion: LUGARES.almagro.dir, destinoLat: LUGARES.recoleta.lat, destinoLng: LUGARES.recoleta.lng, destinoDireccion: LUGARES.recoleta.dir, precioEstimadoCents: 1900, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol9.id, idConductor: "conductor-mock-001", estadoActual: "FINALIZADO", puntajeCalificacion: 2, idCalificacion: "cal_pr_005", comentarioCalificacion: "Tardó mucho en llegar." } })

  // Segunda cancelada por pasajero
  await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.palermo.lat, origenLng: LUGARES.palermo.lng, origenDireccion: LUGARES.palermo.dir, destinoLat: LUGARES.caballito.lat, destinoLng: LUGARES.caballito.lng, destinoDireccion: LUGARES.caballito.dir, precioEstimadoCents: 2100, metodoPago: "EFECTIVO", estado: "CANCELADA_POR_PASAJERO" },
  })

  // Finalizado sin calificación
  const prSol11 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.microcentro.lat, origenLng: LUGARES.microcentro.lng, origenDireccion: LUGARES.microcentro.dir, destinoLat: LUGARES.nunez.lat, destinoLng: LUGARES.nunez.lng, destinoDireccion: LUGARES.nunez.dir, precioEstimadoCents: 3600, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol11.id, idConductor: "conductor-mock-002", estadoActual: "FINALIZADO", puntajeCalificacion: 3, idCalificacion: "cal_pr_008" } })

  // 4 estrellas
  const prSol12 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.belgrano.lat, origenLng: LUGARES.belgrano.lng, origenDireccion: LUGARES.belgrano.dir, destinoLat: LUGARES.villa_crespo.lat, destinoLng: LUGARES.villa_crespo.lng, destinoDireccion: LUGARES.villa_crespo.dir, precioEstimadoCents: 2400, metodoPago: "EFECTIVO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol12.id, idConductor: "conductor-mock-003", estadoActual: "FINALIZADO", puntajeCalificacion: 4, idCalificacion: "cal_pr_006", comentarioCalificacion: "Buen conductor, auto limpio." } })

  // Viaje activo (EN_CURSO) — no aparece en historial, aparece en el viaje activo
  const prSol13 = await prisma.solicitudDeViaje.create({
    data: { pasajeroId: probandoRider.id, origenLat: LUGARES.sanTelmo.lat, origenLng: LUGARES.sanTelmo.lng, origenDireccion: LUGARES.sanTelmo.dir, destinoLat: LUGARES.palermo.lat, destinoLng: LUGARES.palermo.lng, destinoDireccion: LUGARES.palermo.dir, precioEstimadoCents: 2000, metodoPago: "MERCADO_PAGO", estado: "ACEPTADA" },
  })
  await prisma.viaje.create({ data: { solicitudId: prSol13.id, idConductor: "conductor-mock-demo", latitudActual: -34.6200, longitudActual: -58.3750, estadoActual: "EN_CURSO" } })

  console.log("\nSeed completado:")
  console.log("  7 pasajeros: valentina, matias, lucia, nicolas, camila + probandoRider + adminDemo (cuentas reales)")
  console.log("  17 direcciones frecuentes")
  console.log("  28 solicitudes en todos los estados")
  console.log("  probandoRider: 13 viajes → paginación visible en /historial (página 1: 8, página 2: 5)")
  console.log("  adminDemo: 3 viajes + comentarioPromedio")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
