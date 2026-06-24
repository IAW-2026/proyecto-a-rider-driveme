# Integración de Mercado Pago (Pendiente)

Este documento detalla el plan propuesto para reemplazar el mock visual de "Vincular Mercado Pago" por una integración real con la base de datos de la Rider App y la Payments App.

## Open Questions (Por definir con el equipo)

**Flujo de pago exacto con Mercado Pago**
Según el documento de APIs, para crear una transacción en la Payments App se requiere el `id_viaje` y el `id_conductor`. 
Al momento de *pedir* el viaje, todavía no hay un viaje creado ni un conductor asignado (esto recién ocurre cuando un conductor lo acepta en la Driver App). Por lo tanto, no podemos redirigir al usuario a Mercado Pago justo al pedir el viaje.

**¿En qué momento exacto debería redirigirse al pasajero a Mercado Pago?**
* **Opción A:** Cuando el conductor acepta el viaje (el pasajero ve que lo aceptaron y le sale el botón "Pagar viaje" para que lo pague antes de subirse).
* **Opción B:** Cuando el viaje finaliza (el conductor llega a destino, y ahí al pasajero le aparece la pantalla para pagar por MP).

*(Recomendación: La Opción B suele ser el flujo normal donde primero se viaja y luego se efectiviza el cobro, o la Opción A si el modelo de negocio exige que esté pagado por adelantado y congelar los fondos).*

## Cambios Necesarios en Código

### 1. Database Schema (Rider App)
En `prisma/schema.prisma`:
- Modificar el `enum MetodoPago` cambiando `TARJETA` por `MERCADO_PAGO` (para alinearlo con la documentación inter-servicios).
- Agregar el campo `tieneMercadoPago Boolean @default(false)` al modelo `Pasajero`.

### 2. Backend (Rider App)
- **Nuevo Endpoint (`PATCH /api/perfil/pagos`)**: Para que el pasajero pueda activar o desactivar su cuenta de Mercado Pago desde su perfil. Actualizará el campo `tieneMercadoPago` en Prisma.
- **Modificar `app/api/solicitudes/route.ts`**:
  - Actualizar la validación de Zod para que acepte `MERCADO_PAGO` en lugar de `TARJETA`.
  - Antes de crear la solicitud de viaje, verificar en la base de datos que el usuario efectivamente tenga `tieneMercadoPago === true`.

### 3. Frontend (UI)
- **Modificar `app/perfil/PaymentMethods.tsx`**: Transformarlo para que use un Server Action o `fetch` al nuevo endpoint, de modo que el botón "Vincular / Desvincular Mercado Pago" guarde la configuración real en la base de datos y no sea solo un estado visual.
- **Modificar `app/inicio/QuickTripForm.tsx`**:
  - Leer la configuración real del pasajero.
  - Si el pasajero no tiene Mercado Pago vinculado, ocultar la opción de MP en el selector desplegable.
  - Opcionalmente, agregar un texto sutil debajo del botón que diga: *"Modificá tus métodos de pago en tu perfil"*.

### 4. Flujo de Pagos (Viaje Activo)
- En `app/viaje-activo/ViajeActivoCliente.tsx`:
  - En el momento decidido (Opción A o B), implementar la llamada a `POST /api/pagos/transacciones` (para registrarla en Payments App) y `PUT /api/pagos/transacciones` (para procesarla y obtener el `init_point` de Mercado Pago). Estas llamadas usan el `PAYMENTS_SERVICE_SECRET`.
  - Redirigir al pasajero a la URL de Sandbox de Mercado Pago (`init_point`) que devuelve la Payments App para que efectivice el pago.
