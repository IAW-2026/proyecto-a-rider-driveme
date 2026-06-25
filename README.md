[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/EMzZel3N)

# DriveMe — Rider App

## Deploy

[https://proyecto-a-rider-driveme.vercel.app](https://proyecto-a-rider-driveme.vercel.app)

---

## Usuarios de prueba

### Pasajero

| Campo | Valor |
|-------|-------|
| Usuario | `riderdemo` |
| Email | `rider+clerk_test@example.com` |
| Contraseña | `iawuser#` |
| Código de verificación | `424242` |

La cuenta tiene datos precargados para facilitar la evaluación:

- **Historial con paginación**: 13 viajes finalizados/cancelados/expirados → el historial se divide en 2 páginas (límite de 8 por página). El buscador filtra por origen o destino con `?q=` en la URL.
- **Calificaciones a conductores**: viajes finalizados con puntaje variado (5★, 4★, 3★, 2★), algunos con comentario y otros sin él.
- **Viaje activo en curso**: hay un viaje en estado `EN_CURSO` asociado a esta cuenta.
- **Todos los estados**: la cuenta incluye viajes en estado completado, cancelado por el pasajero, cancelado por el conductor y expirado sin conductor.
- **Direcciones frecuentes**: 3 direcciones guardadas (Casa, Trabajo, Gym) visibles en el perfil.

### Administrador

| Campo | Valor |
|-------|-------|
| Usuario | `admindemo` |
| Email | `admin+clerk_test@example.com` |
| Contraseña | `iawuser#` |
| Código de verificación | `424242` |

El panel de administración está disponible en `/admin` — solo accesible con la cuenta de administrador.

---

## Instrucciones para evaluar

1. Ingresar con la cuenta de **pasajero** para recorrer el flujo completo: solicitar un viaje, ver el viaje activo, consultar el historial y gestionar el perfil.
2. Ingresar con la cuenta de **admin** para acceder a `/admin`. Desde ahí se puede buscar y paginar pasajeros, ver el detalle completo de cada uno (direcciones, historial de solicitudes, rating promedio), simular viajes y activar o desactivar cuentas.
3. Desactivar la cuenta del pasajero desde el panel admin e intentar ingresar con ella → se muestra la pantalla de cuenta suspendida.

---

## Descripción del proyecto

DriveMe Rider es la aplicación web para pasajeros de DriveMe, una plataforma de viajes compartidos con temática de Star Wars. Los pasajeros pueden solicitar viajes, seguir el estado en tiempo real desde un mapa interactivo, consultar su historial, calificar a los conductores y gestionar sus direcciones frecuentes.

En la Etapa 3 la app se integró con el resto del sistema mediante APIs REST inter-servicio autenticadas con tokens M2M: se conecta con la Driver App (solicitudes y viajes), la Payments App (pagos), la Feedback App (calificaciones), y expone datos al Control Plane y al Analytics Dashboard. El estado del viaje activo se actualiza en tiempo real mediante WebSocket, de modo que el pasajero ve la posición del conductor en el mapa sin necesidad de recargar la página.

**Flujo de pago:** en efectivo, la solicitud se crea directamente en estado `BUSCANDO_CONDUCTOR`. Con Mercado Pago, el pago se confirma *antes* de buscar conductor: la solicitud se crea en estado `PENDIENTE_PAGO` (invisible para los conductores) y, cuando Payments confirma el pago, pasa a `BUSCANDO_CONDUCTOR` y queda disponible para la Driver App.

El panel de administración permite a los operadores gestionar cuentas de pasajeros (activar/desactivar), revisar el historial completo de solicitudes y viajes, y simular cambios de estado para testing. Está pensado principalmente para uso en desktop.

El stack es Next.js 15 (App Router) + Prisma + PostgreSQL (Neon) + Clerk para autenticación. El deploy está en Vercel.

---

## Notas para la corrección

**Mobile en el panel admin:** las tablas de pasajeros, solicitudes y viajes tienen scroll horizontal en mobile (se puede deslizar). Soy consciente de que el layout general no está optimizado para pantallas muy pequeñas dado que la densidad de información de las tablas no se reorganiza bien en columnas apiladas sin perder legibilidad.

**Lighthouse:** algunas advertencias de Lighthouse son inherentes a las dependencias del proyecto (Clerk, Leaflet/OpenStreetMap) y no se pueden resolver desde el código. Se documenta en detalle en [docs/lighthouse.md](docs/lighthouse.md).

**Correr localmente:**

```bash
npm install
npm run dev
```

Requiere las variables de entorno de `.env.local` (Clerk, base de datos PostgreSQL, URLs y tokens de servicio de las otras apps).