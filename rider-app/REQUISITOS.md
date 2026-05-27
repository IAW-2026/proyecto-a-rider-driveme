# 🧭 Rider App — Contexto y requisitos completos (Etapa 2)

Sos un asistente de desarrollo trabajando en la **Rider App** de una plataforma de transporte estilo Uber (Tipo A — IAW 2026). Esta app es responsabilidad individual de Martina Andres y debe funcionar de forma completamente aislada en esta etapa. Las llamadas a otras apps se **mockean**.

---

## Stack tecnológico obligatorio

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js** (fullstack, App Router o Pages Router) |
| Base de datos | **PostgreSQL** propia (Railway / Supabase / Neon / Vercel Postgres) |
| ORM | Prisma, Knex, o `pg` directo |
| Autenticación | **Clerk** (JWT con claims `sub`, `role`, `exp`) |
| Estilos | Tailwind CSS, Chakra UI o Bootstrap |
| Deploy | **Vercel** (una instancia propia) |

---

## Modelo de datos — tablas que viven en la BD de Rider App

### `Pasajero`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID/String | PK. Usar el `sub` de Clerk como ID compartido. |
| `nombre` | String | |
| `email` | String | Único. |
| `telefono` | String | |
| `rating_promedio` | Decimal | Cacheado desde Feedback App. En Etapa 2, valor fijo. |

### `DireccionFrecuente`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id_dir` | UUID | PK |
| `id_pasajero` | UUID | FK → Pasajero |
| `nombreVivienda` | String | Ej: "Casa", "Trabajo" |
| `latitud` | Float | |
| `longitud` | Float | |
| `direccion` | String | Dirección legible |

### `SolicitudDeViaje`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id_solicitud` | UUID | PK |
| `id_pasajero` | UUID | FK → Pasajero |
| `origen_direccion` | String | |
| `origen_latitud` | Float | |
| `origen_longitud` | Float | |
| `destino_direccion` | String | |
| `destino_latitud` | Float | |
| `destino_longitud` | Float | |
| `precio_estimado` | Decimal | |
| `metodo_pago` | ENUM | `EFECTIVO`, `TARJETA` |
| `estado` | ENUM | `BUSCANDO_CONDUCTOR`, `ACEPTADA`, `CANCELADA_POR_PASAJERO`, `EXPIRADA_SIN_ACEPTACION` |
| `creado_en` | Timestamp | |

### `Viaje` (read-only en Rider — la Driver App es la dueña)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id_viaje` | UUID | PK. Debe coincidir con el ID en Driver App. |
| `id_solicitud` | UUID | FK → SolicitudDeViaje (1:1) |
| `id_conductor` | UUID | ID del conductor (proveniente de Driver App) |
| `estado_actual` | ENUM | `ACEPTADO`, `EN_CURSO`, `FINALIZADO`, `CANCELADO_POR_CONDUCTOR` |

> ⚠️ **Rider App NO escribe el estado del Viaje**. Solo lo almacena como vista materializada de lectura. El ownership del ciclo de vida del viaje es de Driver App.

---

## Endpoints que Rider App DEBE exponer (para que otras apps los consuman en Etapa 3)

Estos endpoints deben estar implementados y funcionar correctamente ya en Etapa 2, aunque en esta etapa nadie los llame de verdad todavía.

### A. `POST /api/viajes` — Sincronización de viaje aceptado
**Quién llama:** Driver App (M2M)  
**Auth:** Header `x-api-key: <INTERNAL_API_KEY>`  
**Request:**
```json
{
  "id_solicitud": "sol_abc123",
  "id_conductor": "cond_2pX...",
  "id_vehiculo": "veh_abc123",
  "latitud_actual": -38.7183,
  "longitud_actual": -62.2664
}
```
**Response:** `201 Created`
```json
{
  "id_viaje": "uuid-12345",
  "id_solicitud": "sol_abc123",
  "estado_actual": "ACEPTADO",
  "precio_estimado": 2550.00,
  "metodo_pago": "TARJETA",
  "pasajero": { "id_pasajero": "pas_9qL..." },
  "origen": { "direccion": "Av. Alem 123", "latitud": -38.7191, "longitud": -62.2652 },
  "destino": { "direccion": "Zapiola 456", "latitud": -38.7021, "longitud": -62.2801 }
}
```
**Lógica:** Cambia `SolicitudDeViaje.estado` de `BUSCANDO_CONDUCTOR` → `ACEPTADA` y crea el registro `Viaje`. Si la solicitud ya fue aceptada, retornar `409 Conflict`.

---

### B. `GET /api/pasajeros/{id_pasajero}/viajes/activos` — Viaje activo del pasajero
**Quién llama:** Driver App (y la propia Rider UI)  
**Auth:** JWT del conductor o M2M  
**Response:**
```json
{
  "id_pasajero": "pas_9qL...",
  "viaje_activo": {
    "id_viaje": "uuid-12345",
    "id_solicitud": "sol_abc123",
    "estado_actual": "EN_CURSO",
    "id_conductor": "cond_2pX..."
  }
}
```
Si no hay viaje activo, retornar `viaje_activo: null`.

---

### C. `POST /api/pasajero/reputacion` — Actualizar rating del pasajero
**Quién llama:** Feedback App (M2M)  
**Auth:** Header `x-api-key: <INTERNAL_API_KEY>`  
**Request:**
```json
{
  "id_pasajero": "pas_9qL...",
  "puntaje": 4.8,
  "comentario_promedio": "Pasajero puntual y respetuoso."
}
```
**Response:** `200 OK`  
**Lógica:** Actualiza `Pasajero.rating_promedio`.

---

### D. `POST /api/notificaciones/viajes/{id_viaje}/estado` — Notificación de cambio de estado
**Quién llama:** Uso interno / Driver App  
**Request:**
```json
{
  "id_viaje": "uuid-12345",
  "id_pasajero": "pas_9qL...",
  "estado_actual": "EN_CURSO",
  "fuente": "DRIVER_APP"
}
```
**Response:** `200 OK`

---

### E. `POST /api/viajes/{id_viaje}/pago-confirmado` — Webhook de pago
**Quién llama:** Payments App (M2M)  
**Request:**
```json
{
  "id_transaccion": "tx_98765",
  "estado": "CAPTURED",
  "monto": 2550.00
}
```
**Response:** `200 OK`

---

### F. `PATCH /api/solicitudes/{id_solicitud}` — Cancelar solicitud o expirar timer
**Quién llama:** El propio frontend de Rider App (pasajero) o el timer automático  
**Auth:** JWT del pasajero (`role=rider`). Solo puede operar sobre sus propias solicitudes.  
**Precondición:** La solicitud debe estar en estado `BUSCANDO_CONDUCTOR`. Si ya hay un viaje creado → `409 Conflict`.  
**Request:**
```json
{
  "id_pasajero": "pas_9qL...",
  "estado": "CANCELADA_POR_PASAJERO",
  "motivo": "DESISTIO"
}
```
**Response:**
```json
{
  "id_solicitud": "sol_abc123",
  "estado": "CANCELADA_POR_PASAJERO"
}
```
**Nota:** Cuando el timer de 2 minutos vence sin aceptación, el frontend dispara este endpoint automáticamente con `estado: "EXPIRADA_SIN_ACEPTACION"` y `motivo: "TIEMPO_EXCEDIDO"`.

---

### G. `GET /api/solicitudes` — Listado de solicitudes disponibles (para Driver App)
**Quién llama:** Driver App  
**Auth:** JWT del conductor (`role=driver`)  
**Query params:** `estado`, `limit`, `offset`, `latitud`, `longitud`, `radius`, `orden`  
**Response:** Objeto paginado con array `solicitudes`. Ver contrato completo en `03-apis.md`.  
> ⚠️ No exponer PII del pasajero (sin nombre, sin teléfono).

---

## Endpoints de otras apps que Rider App consume (mockear en Etapa 2)

En Etapa 2 estas llamadas deben simularse con datos hardcodeados o stubs. Los contratos ya están acordados.

| Acción | Endpoint (app destino) | Cuándo |
|--------|----------------------|--------|
| Ver telemetría del conductor en el mapa | `GET /api/viajes/{id_viaje}/telemetria` → **Driver App** | Cada ~5-10s mientras viaje está `EN_CURSO` |
| Enviar reseña del conductor | `POST /api/resenas` → **Feedback App** | Al finalizar el viaje |
| Reportar una calificación | `POST /api/reportes` → **Feedback App** | Cuando el pasajero reporta |
| Agregar método de pago | `POST /api/pagos/methods` → **Payments App** | Desde perfil del pasajero |
| Solicitar reembolso | `POST /api/pagos/{id_transaccion}/refunds` → **Payments App** | Desde historial |

---

## Páginas / vistas que debe tener la app

### Flujo principal del pasajero (autenticado como `role=rider`)
- **Pantalla de solicitud de viaje:** ingresar origen y destino (con mapa o campos de texto), elegir método de pago, ver precio estimado, botón "Solicitar".
- **Pantalla de espera:** muestra que se está buscando conductor. Timer de 2 minutos. Botón "Cancelar" → `PATCH /api/solicitudes/{id}`.
- **Pantalla de viaje en curso:** datos del conductor (mockeados en Etapa 2), mapa con posición del auto (polleando `GET /api/viajes/{id}/telemetria` de Driver App, mockeado). Estado actual del viaje.
- **Pantalla de viaje finalizado:** resumen del viaje, monto cobrado, botón para calificar al conductor.
- **Pantalla de calificación:** estrellas (1-5) + comentario opcional → llama a `POST /api/resenas` de Feedback App (mockeado).
- **Historial de viajes:** listado paginado de viajes del pasajero con búsqueda. Parámetros en la URL.
- **Perfil del pasajero:** datos personales, direcciones frecuentes (CRUD), métodos de pago (llama a Payments, mockeado en Etapa 2).

### Panel de administración (autenticado como `admin`)
- Listado de pasajeros con búsqueda y paginación.
- Listado de solicitudes de viaje (con filtro por estado).
- Listado de viajes con sus estados.
- Al menos un reporte o listado relevante (ej: viajes por estado, pasajeros con mejor/peor rating).
- Gestión básica (ver detalle, activar/desactivar pasajero).

---

## Requisitos obligatorios de la Etapa 2 — checklist

- [ ] **Páginas y componentes reutilizables** en Next.js (layout, header, cards, etc.)
- [ ] **API REST propia** — todos los endpoints de la sección anterior implementados y funcionales
- [ ] **PostgreSQL propia** — app conectada a su propia BD, no comparte con nadie
- [ ] **Autenticación con Clerk:**
  - Login/logout para **administrador** (obligatorio)
  - Login/logout para **pasajero** (`role=rider` en `publicMetadata`) (obligatorio)
  - El `sub` de Clerk se usa como ID compartido entre servicios
- [ ] **Panel de administración** con gestión de datos principales y al menos un reporte
- [ ] **Búsqueda y paginación** con parámetros en la URL (ej: `?page=2&q=martinez`)
- [ ] **Manejo de errores:** página 404 personalizada, errores generales manejados
- [ ] **Validación de formularios del lado del servidor** (no solo cliente)
- [ ] **Accesibilidad básica:** labels en inputs, roles ARIA donde corresponda, contraste adecuado
- [ ] **Consumo de al menos una API externa real** (request real + procesar respuesta, no embed). Opciones relevantes para Rider App: Google Maps / OpenStreetMap para geocoding o rutas, API del clima, OSRM para estimación de distancias, etc.
- [ ] **Datos precargados:** la app no puede estar vacía. Debe tener pasajeros, solicitudes en distintos estados, viajes en distintos estados, direcciones frecuentes, etc. Hacerlo con un script seed.
- [ ] **Variables de entorno:** `.env.local` en `.gitignore`, archivo `.env.example` con los nombres sin valores, variables configuradas en Vercel.
- [ ] **Deploy en Vercel** funcionando con link de producción.
- [ ] **README** con: descripción, link al deploy, credenciales para acceder como admin y como pasajero.
- [ ] **Historial de commits** progresivo — commits regulares, mensajes descriptivos.

### Opcional (suma puntos)
- [ ] Funcionalidad de IA: sugerencias de destino, descripción automática de viajes, chatbot de soporte, etc.

---

## Variables de entorno necesarias (`.env.example`)

```env
# Base de datos
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=

# Auth M2M (para validar llamadas de Driver App y Feedback App)
INTERNAL_API_KEY=

# API externa (la que elijas integrar)
MAPS_API_KEY=

# URLs de otras apps (para mocks o integración futura)
DRIVER_APP_URL=
PAYMENTS_APP_URL=
FEEDBACK_APP_URL=
```

---

## Autenticación M2M — cómo validar en endpoints internos

Los endpoints marcados como `[M2M]` (que reciben llamadas de Driver App o Feedback App) deben validar el header:

```javascript
// middleware o helper
function requireM2M(req) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    throw new Error('Unauthorized M2M access');
  }
}
```

---

## Estados canónicos acordados (NO cambiar)

| Entidad | Estados válidos |
|---------|----------------|
| `SolicitudDeViaje.estado` | `BUSCANDO_CONDUCTOR`, `ACEPTADA`, `CANCELADA_POR_PASAJERO`, `EXPIRADA_SIN_ACEPTACION` |
| `Viaje.estado_actual` | `ACEPTADO`, `EN_CURSO`, `FINALIZADO`, `CANCELADO_POR_CONDUCTOR` |

> ⚠️ Rider App **no puede cambiar** el estado de un `Viaje`. Solo Driver App tiene ese permiso.

---

## Datos que deben estar precargados (seed)

- Al menos 5 pasajeros con distintos ratings
- Al menos 10 solicitudes en distintos estados (`BUSCANDO_CONDUCTOR`, `ACEPTADA`, `CANCELADA_POR_PASAJERO`, `EXPIRADA_SIN_ACEPTACION`)
- Al menos 8 viajes en distintos estados (`ACEPTADO`, `EN_CURSO`, `FINALIZADO`, `CANCELADO_POR_CONDUCTOR`)
- Direcciones frecuentes para los pasajeros
- Un usuario admin creado en Clerk y registrado en la BD

---

## Notas de diseño importantes

- **Rider App NO cancela viajes ya aceptados.** Una vez que existe un `Viaje`, la cancelación es responsabilidad de Driver App (solo el conductor puede hacerlo).
- **Rider App NO inicia ni finaliza viajes.** Solo muestra el estado que Driver App decide.
- El **precio estimado** lo calcula Rider App antes de solicitar. El **precio final** lo define Driver App al cerrar el viaje.
- La **telemetría** (posición del conductor en el mapa) viene de Driver App — mockeada en Etapa 2 con coordenadas estáticas o con una pequeña animación simulada.
- El `id_viaje` en la tabla `Viaje` de Rider App debe ser el mismo UUID que usa Driver App (se recibe en el payload del endpoint A cuando Driver App llama a Rider).