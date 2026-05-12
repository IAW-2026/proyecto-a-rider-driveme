# CLAUDE.md — Rider App

## Qué es esta app
**Rider App** — interfaz para pasajeros de una plataforma de transporte on-demand (estilo Uber).
Proyecto IAW 2026, Tipo A. Responsable: Martina Andres.
Esta app es **independiente** — en Etapa 2 las otras apps se mockean. Los contratos de API están definidos y deben respetarse.

## Stack exacto (versiones importantes)
- Next.js **16.2.5** — el middleware se llama `src/proxy.ts`, NO `middleware.ts`
- Prisma **7.8.0** — la URL de BD va en `prisma.config.ts`, NO en `schema.prisma`
- Clerk **7.3.1** — rol del pasajero: `publicMetadata.role = "rider"`
- Tailwind **4** + shadcn (style: `base-nova`)
- Deploy: Vercel + **Neon** (PostgreSQL)

## Comandos
```bash
npm run dev
npm run build
npm run lint
npx prisma migrate dev
npx prisma generate
npx prisma studio
npm run seed
```

## Prisma 7 — reglas críticas
- La URL de BD va en `prisma.config.ts`, el `datasource db` en el schema **NO lleva `url`**
- `PrismaClient` se instancia sin `datasourceUrl`
- Usar siempre el singleton en `src/lib/prisma.ts`

## Next.js 16 — reglas críticas
- El middleware es `src/proxy.ts` (no `middleware.ts`)
- Leer `node_modules/next/dist/docs/` antes de usar APIs de routing

---

## Modelo de datos (Rider App es dueña de estos datos)

### Entidad: Pasajero
| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK. Debe coincidir con el `sub` del JWT de Clerk |
| `nombre` | String | Nombre completo |
| `email` | String | Único. Usado para login y comunicaciones |
| `telefono` | String | Para coordinación con el conductor |
| `rating_promedio` | Decimal | Calculado/cacheado. Lo actualiza la Feedback App vía POST /api/pasajero/reputacion |

### Entidad: DireccionFrecuente
| Campo | Tipo | Reglas |
|---|---|---|
| `id_dir` | UUID | PK |
| `id_pasajero` | UUID | FK → Pasajero.id |
| `nombreVivienda` | String | Etiqueta personalizada (ej: "Casa", "Trabajo") |
| `latitud` | Decimal | Coordenada |
| `longitud` | Decimal | Coordenada |

### Entidad: SolicitudDeViaje
| Campo | Tipo | Reglas |
|---|---|---|
| `id_solicitud` | UUID | PK |
| `id_pasajero` | UUID | FK → Pasajero.id |
| `origen` | String | Punto de partida |
| `destino` | String | Punto de llegada |
| `precio_estimado` | Decimal | Tarifa sugerida antes de iniciar |
| `metodo_pago` | ENUM | `EFECTIVO`, `TARJETA` |
| `estado` | ENUM | `BUSCANDO_CONDUCTOR`, `ACEPTADA`, `CANCELADA_POR_PASAJERO`, `EXPIRADA_SIN_ACEPTACION` |

**Regla de negocio:** El pasajero solo puede cancelar la solicitud mientras está en estado `BUSCANDO_CONDUCTOR`. Una vez `ACEPTADA`, solo el conductor puede cancelar (desde Driver App).

### Entidad: Viaje (vista de solo lectura)
| Campo | Tipo | Reglas |
|---|---|---|
| `id_viaje` | UUID | PK. Debe coincidir con el ID en Driver App |
| `id_solicitud` | UUID | FK 1:1 → SolicitudDeViaje.id_solicitud |
| `id_conductor` | UUID | ID del conductor (dato de Driver App) |
| `estado_actual` | ENUM | `ACEPTADO`, `EN_CURSO`, `FINALIZADO`, `CANCELADO_POR_CONDUCTOR` |

**IMPORTANTE:** Rider App NO escribe el estado del viaje. Solo lo lee/visualiza. La Driver App es la dueña del ciclo de vida del viaje.

### Schema Prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Pasajero {
  id              String               @id @default(uuid())
  nombre          String
  email           String               @unique
  telefono        String?
  rating_promedio Decimal              @default(0)
  isActive        Boolean              @default(true)
  createdAt       DateTime             @default(now())
  solicitudes     SolicitudDeViaje[]
  direcciones     DireccionFrecuente[]
  viajes          Viaje[]
}

model DireccionFrecuente {
  id_dir        String   @id @default(uuid())
  id_pasajero   String
  nombreVivienda String
  latitud       Decimal
  longitud      Decimal
  pasajero      Pasajero @relation(fields: [id_pasajero], references: [id])
}

model SolicitudDeViaje {
  id_solicitud    String   @id @default(uuid())
  id_pasajero     String
  origen          String
  destino         String
  precio_estimado Decimal
  metodo_pago     MetodoPago @default(EFECTIVO)
  estado          EstadoSolicitud @default(BUSCANDO_CONDUCTOR)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  pasajero        Pasajero @relation(fields: [id_pasajero], references: [id])
  viaje           Viaje?
}

model Viaje {
  id_viaje      String      @id @default(uuid())
  id_solicitud  String      @unique
  id_conductor  String
  estado_actual EstadoViaje @default(ACEPTADO)
  id_pasajero   String
  updatedAt     DateTime    @updatedAt
  solicitud     SolicitudDeViaje @relation(fields: [id_solicitud], references: [id_solicitud])
  pasajero      Pasajero    @relation(fields: [id_pasajero], references: [id])
}

enum MetodoPago {
  EFECTIVO
  TARJETA
}

enum EstadoSolicitud {
  BUSCANDO_CONDUCTOR
  ACEPTADA
  CANCELADA_POR_PASAJERO
  EXPIRADA_SIN_ACEPTACION
}

enum EstadoViaje {
  ACEPTADO
  EN_CURSO
  FINALIZADO
  CANCELADO_POR_CONDUCTOR
}
```

---

## APIs que esta app expone (para que otras apps consuman)

### GET /api/solicitudes?estado=BUSCANDO_CONDUCTOR
- **Quién llama:** Driver App (para ver solicitudes disponibles)
- **Auth:** Token válido con `role=driver`
- **Response:**
```json
{
  "solicitudes": [
    {
      "id_solicitud": "uuid",
      "origen": "Av. Corrientes 1234",
      "destino": "Palermo Soho",
      "precio_estimado": 2500,
      "metodo_pago": "TARJETA"
    }
  ]
}
```

### POST /api/viajes
- **Quién llama:** Driver App (cuando un conductor acepta una solicitud)
- **Auth:** Token válido con `role=driver`
- **Request:**
```json
{
  "id_solicitud": "uuid",
  "id_conductor": "uuid"
}
```
- **Response:** `201` con el viaje creado
- **Lógica:** Cambia el estado de la solicitud a `ACEPTADA` y crea el registro `Viaje`

### GET /api/pasajeros/{id_pasajero}/viajes/activos
- **Quién llama:** Rider App frontend (para mostrar el viaje en curso al pasajero)
- **Auth:** Token válido con `role=rider`, `sub` debe coincidir con `id_pasajero`
- **Response:** El viaje activo del pasajero (estado `ACEPTADO` o `EN_CURSO`)

### PATCH /api/solicitudes/{id_solicitud}
- **Quién llama:** Rider App frontend (pasajero cancela mientras busca conductor)
- **Auth:** Token válido con `role=rider`, solicitud propia
- **Regla:** Solo funciona si el estado es `BUSCANDO_CONDUCTOR`
- **Request:** `{ "estado": "CANCELADA_POR_PASAJERO" }`

### POST /api/pasajero/reputacion
- **Quién llama:** Feedback App (actualiza el rating del pasajero tras una calificación)
- **Auth:** Token de servicio M2M
- **Request:** `{ "id_pasajero": "uuid", "nuevo_rating": 4.3 }`

### POST /api/viajes/{id_viaje}/pago-confirmado
- **Quién llama:** Payments App (confirma que el pago fue procesado)
- **Auth:** Token de servicio M2M
- **Lógica:** Actualiza el estado del viaje a `FINALIZADO` en la vista de Rider

---

## APIs que esta app consume (de otras apps)

| Acción | App destino | Endpoint | En Etapa 2 |
|---|---|---|---|
| Ver telemetría del viaje (ubicación del conductor) | Driver App | GET /api/viajes/{id}/telemetria | **MOCKEAR** |
| Enviar calificación del conductor | Feedback App | POST /api/resenas | **MOCKEAR** |
| Reportar una calificación | Feedback App | POST /api/reportes | **MOCKEAR** |

**Cómo mockear en Etapa 2:** Crear un archivo `src/lib/mocks.ts` con funciones que devuelvan datos hardcodeados con la misma forma que devolvería la API real.

---

## Autenticación con Clerk

### Roles implementados
- `publicMetadata.role = "rider"` — asignado **automáticamente** al registrarse vía webhook
- `publicMetadata.role = "admin"` — asignado **manualmente** desde el dashboard de Clerk editando el `publicMetadata` del usuario

### Google OAuth
- Desactivado. Todos los usuarios se registran con email/contraseña para poder controlar el rol automáticamente.

### Webhook de Clerk
- Endpoint: `POST /api/webhooks/clerk`
- Librería de verificación: `svix` (ya instalada)
- Evento escuchado: `user.created`
- Lógica: al registrarse, Clerk llama al webhook → se asigna `role: "rider"` en `publicMetadata` vía `clerkClient.users.updateUserMetadata` → se crea el registro `Pasajero` en la BD
- La ruta `/api/webhooks(.*)` está marcada como pública en `proxy.ts` para que Clerk pueda llamarla sin token
- Variable de entorno necesaria: `CLERK_WEBHOOK_SECRET=whsec_...`

### Claims usados
- `sub` — ID global del usuario, se usa como `id` del `Pasajero` en la BD
- `role` — `"rider"` o `"admin"`
- `exp` — expiración del token

### Autorización por rol
- Rutas `(rider)` → solo accesibles con `role=rider`
- Rutas `(admin)` → solo accesibles con `role=admin`
- Verificar el rol en cada endpoint sensible además del middleware

---

## Estructura de carpetas

```
src/
├── proxy.ts                          ← middleware Clerk
├── lib/
│   ├── prisma.ts                     ← singleton PrismaClient
│   └── mocks.ts                      ← datos mockeados de Driver y Feedback App
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (rider)/                      ← páginas del pasajero
│   │   ├── page.tsx                  ← home / solicitar viaje
│   │   ├── viaje/[id]/               ← seguimiento del viaje activo
│   │   ├── historial/                ← historial de viajes
│   │   └── perfil/                   ← direcciones frecuentes, método de pago
│   ├── (admin)/                      ← panel de administración
│   │   ├── pasajeros/                ← listado y gestión de pasajeros
│   │   └── solicitudes/              ← listado de solicitudes
│   └── api/
│       ├── webhooks/clerk/           ← webhook Clerk → asigna rol + crea Pasajero en BD
│       ├── solicitudes/              ← GET / POST / PATCH
│       ├── viajes/                   ← GET / POST
│       ├── pasajeros/                ← GET / PATCH reputacion
│       └── direcciones/              ← CRUD direcciones frecuentes
└── components/
    ├── ui/                           ← shadcn components
    ├── solicitud/                    ← FormularioSolicitud, MapaOrigen
    ├── viaje/                        ← SeguimientoViaje, EstadoBadge
    └── historial/                    ← TablaViajes, FiltroEstado
```

---

## Requisitos de Etapa 2 a cumplir

| Requisito | Estado |
|---|---|
| Páginas y componentes reutilizables | — |
| API propia con endpoints REST | — |
| Base de datos PostgreSQL propia |  Neon conectado |
| Autenticación Clerk (rider + admin) |  Webhook implementado, roles configurados |
| Panel de administración | — |
| Búsqueda y paginación con params en URL | — |
| Manejo de errores y páginas 404 | — |
| Validación de formularios server-side | — |
| Accesibilidad básica | — |
| Consumo de al menos una API externa | — |
| Datos precargados (seed) | — |

---

## Variables de entorno (.env.local)

```
# Neon — la misma URL sirve para runtime y CLI en Neon (no necesita DIRECT_URL separada)
DATABASE_URL=postgresql://...

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...   ← copiarlo del dashboard de Clerk → Webhooks → Signing Secret

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

**Nota Neon:** A diferencia de Supabase, Neon no requiere `DIRECT_URL` separada. La misma `DATABASE_URL` funciona tanto para el runtime de Next.js como para las migraciones de Prisma CLI.

---

## Datos duplicados y estrategia de consistencia

| Dato | Apps que lo tienen | Fuente de verdad | Estrategia |
|---|---|---|---|
| Usuario (clerk_user_id) | Todas | Clerk | Cada app sincroniza al primer login vía webhook |
| Viaje (id_viaje, estado) | Rider y Driver App | **Driver App** | Driver App es dueña. Rider solo tiene vista de lectura. Los cambios de estado llegan a Rider via API o polling |

---

## Prioridad de implementación

1. `prisma/schema.prisma` + migración
2. `src/lib/prisma.ts` singleton
3. `src/proxy.ts` middleware Clerk (con `/api/webhooks(.*)` como ruta pública)
4.  Webhook `POST /api/webhooks/clerk` — asigna `role: "rider"` + crea Pasajero en BD
5. `POST /api/solicitudes` — crear solicitud de viaje
6. `GET /api/solicitudes?estado=BUSCANDO_CONDUCTOR` — para Driver App
7. `POST /api/viajes` — Driver App acepta solicitud
8. `GET /api/pasajeros/{id}/viajes/activos` — seguimiento
9. `PATCH /api/solicitudes/{id}` — cancelar solicitud
10. Panel de administración con listado de pasajeros y solicitudes
11. Búsqueda y paginación
12. Seed con datos de prueba
13. Manejo de errores y 404