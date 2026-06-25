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
| Email | `rider+clerk_test@iaw.com` |
| Contraseña | `iawuser#` |
| Código de verificación | `424242` |

La cuenta fue limpiada para facilitar la evaluación de flujos completos desde cero:

- **Historial**: Hay viajes existentes para ver el historial, pero no hay viajes activos ni pendientes de pago. Esto permite probar el flujo completo de creación de viaje sin contaminación de datos de prueba.
- **Sin viaje activo**: La cuenta está lista para solicitar un nuevo viaje.
- **Direcciones frecuentes**: 2 direcciones guardadas (Casa, Gym) visibles en el perfil para facilitar pedir el viaje.

### Administrador

| Campo | Valor |
|-------|-------|
| Usuario | `admindemo` |
| Email | `admin+clerk_test@iaw.com` |
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