# Cambios implementados

## Parte A — Alineación de contrato inter-servicios

### A1 + A6 — Schema: nuevos campos en Prisma
Archivo: `prisma/schema.prisma`

- `Pasajero.comentarioPromedio String?` — almacena el comentario promedio calculado por Feedback App
- `Viaje.idViajeDriver String? @unique` — almacena el ID del viaje en Driver App para correlacionar ambos sistemas

Aplicado con `prisma db push` (la BD usa `db push`, no migraciones).

---

### A2 — `POST /api/pasajero/reputacion`
Archivo: `app/api/pasajero/reputacion/route.ts`

Ahora lee y persiste `comentario_promedio` del body (campo opcional enviado por Feedback App junto con `puntaje`).

---

### A3 — `POST /api/viajes`
Archivo: `app/api/viajes/route.ts`

- Elimina `nombre` del `select` de Prisma y de la response (era PII en endpoint M2M, violaba contrato 1.3)
- Acepta `id_viaje` en el body y lo guarda como `idViajeDriver` en el registro Viaje

---

### A4 — `GET /api/solicitudes`
Archivo: `app/api/solicitudes/route.ts`

- Elimina `nombre` del `select` de Prisma y de la response del GET (campo `pasajero.nombre` no debe exponerse en endpoints M2M)

---

### A5 — `PATCH /api/solicitudes/[id_solicitud]`
Archivo: `app/api/solicitudes/[id_solicitud]/route.ts`

Valida el campo `motivo` contra los valores permitidos por contrato: `DESISTIO`, `TIEMPO_EXCEDIDO`, `ERROR_ORIGEN_DESTINO`. Devuelve `400` si el valor no es válido.

---

### A7 — Mock `GET /api/pagos/transacciones/[id_transaccion]`
Archivo: `app/api/pagos/transacciones/[id_transaccion]/route.ts` *(nuevo)*

Endpoint M2M que simula el GET de transacciones del servicio de Payments:
- Si Payments ya confirmó el pago (`pago-confirmado` fue llamado), devuelve los datos reales de la tabla `Transaccion`
- Si no hay datos, devuelve `{ estado: "PENDIENTE", monto: null }` como mock

---

## Parte B — Mejoras al detalle de viaje (`/historial/[id_solicitud]`)

### B1 — Card de PAGO
Archivo: `app/historial/[id_solicitud]/page.tsx`

Cuando el viaje tiene una transacción registrada, aparece una card lateral **PAGO** con:
- Estado (`CAPTURED` → "Pago confirmado" / `FAILED` → "Pago fallido")
- Monto en pesos ARS
- ID de transacción abreviado

La transacción se obtiene con `prisma.transaccion.findFirst` por `viajeId`.

---

### B2 — Card de VIAJE ASIGNADO
Archivo: `app/historial/[id_solicitud]/page.tsx`

Cuando Driver App aceptó el viaje (existe `solicitud.viaje`), aparece una card **VIAJE ASIGNADO** en la info principal con:
- ID Rider (primeros 8 chars del UUID interno)
- ID Driver (`idViajeDriver`) si fue enviado por Driver App
- Vehículo (`idVehiculo`) si está disponible

---

### B3 — FeedbackActions: mostrar calificación enviada
Archivo: `app/historial/[id_solicitud]/FeedbackActions.tsx`

Cuando el usuario ya calificó (`feedbackYaDado` o `enviado`), ahora muestra:
- Estrellas reales: `★★★★☆` según el puntaje (en lugar del `★` fijo anterior)
- Comentario enviado (en cursiva, separado con línea)

El puntaje y comentario se resuelven por prioridad:
1. Estado local de la sesión (recién enviado)
2. `localStorage` (`feedback_puntaje_*`, `feedback_comentario_*`) — guardado al enviar
3. Props `puntajeGuardado` / `comentarioGuardado` desde la BD (pasadas por `page.tsx`)

Al enviar feedback, además de guardar `feedback_viaje_*` y `feedback_calificacion_*`, ahora también guarda `feedback_puntaje_*` y `feedback_comentario_*` en localStorage.
