[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/EMzZel3N)
# Rider

Aplicación **Rider** del [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `DriveMe`.

Esta app corresponde al rol del pasajero en el proyecto de tipo **A (Transporte)**.

Enunciado completo: <https://iaw-2026.github.io/proyecto/>
---

# DriveMe — Rider App

Aplicación web para pasajeros de DriveMe, una plataforma de viajes compartidos con temática de `Star Wars`. Permite solicitar viajes, seguir el estado en tiempo real, consultar el historial y gestionar el perfil. Incluye un panel de administración para gestionar pasajeros y solicitudes.

## Deploy

[https://proyecto-a-rider-driveme.vercel.app](https://proyecto-a-rider-driveme.vercel.app)

## Acceso

### Pasajero (usuario final)

| Campo | Valor |
|-------|-------|
| Usuario | `probandoRider` |
| Contraseña | `IAW2026rider` |

Esta cuenta tiene datos de prueba precargados para facilitar la evaluación:

- **Historial con paginación**: 13 viajes finalizados/cancelados/expirados → el historial se divide en 2 páginas (límite de 8 por página). El buscador filtra por origen o destino con `?q=` en la URL.
- **Calificaciones a conductores**: varios viajes con puntaje (5★, 4★, 3★, 2★) y comentario, y otros sin calificar.
- **Viaje activo en curso**: hay un viaje en estado `EN_CURSO` asociado a esta cuenta.
- **Todos los estados**: la cuenta incluye viajes en estado completado, cancelado por el pasajero, cancelado por el conductor y expirado sin conductor.
- **Direcciones frecuentes**: 3 direcciones guardadas (Casa, Trabajo, Gym) visibles en el perfil.

### Administrador

| Campo | Valor |
|-------|-------|
| Usuario | `accesoAdmin` |
| Contraseña | `IAW2026admin` |

El panel de administración está disponible en `/admin` — solo accesible con la cuenta de administrador. Desde ahí se puede buscar y paginar pasajeros, ver el detalle completo de cada uno (direcciones, historial de solicitudes, rating promedio), sumular los viajes y activar o desactivar cuentas. Al desactivar `probandoRider` e intentar ingresar con esa cuenta, se muestra la pantalla de cuenta suspendida.

## Correr localmente

```bash
npm install
npm run dev
```

Requiere las variables de entorno de `.env.local` (Clerk, base de datos PostgreSQL).

---

## Nota sobre hallazgos de Lighthouse

Dejo registro de errores que me marcaba Lighthouse a la hora de correr las pruebas. Estas advertencias quedan fuera de mi alcance ya que son "problemas" que se generan al integrar Clerk.

**Clerk (proveedor de autenticación)**
- *Reduce unused JavaScript* — los bundles `clerk.browser.js`, `ui.browser.js`, `vendors_ui_*.js` (~290 KiB) los sirve Clerk desde su CDN. No se puede modificar su tamaño ni estructura.
- *Third-party cookies* — `__cf_bm` y `_cfuvid` son cookies de Cloudflare inyectadas automáticamente por la infraestructura de Clerk (bot management y rate limiting).
- *Imagen de avatar en JPEG/PNG* — el avatar lo sirve `img.clerk.com` sin soporte WebP/AVIF. No se puede cambiar el formato del CDN de Clerk.
- *Cache TTL bajo en img.clerk.com* — Clerk fija el TTL en 1 día. No se puede modificar el `Cache-Control` de un servidor externo.
- *Animaciones no compuestas* — Clerk anima `max-height` en sus componentes internos (`cl-internal-*`). Es código de Clerk, no del proyecto.
- *Back/forward cache (4 motivos)* — el bfcache queda bloqueado por razones fuera del alcance del proyecto: los bundles JS de Clerk se sirven con `Cache-Control: no-store` (razones 2 y 3), un error interno del navegador (razón 4), y la propia página `/inicio` recibe `no-store` de Next.js/Vercel al ser dinámica (razón 1), lo cual tampoco es modificable sin afectar la correcta actualización de datos de sesión.

**Next.js internals**
- *Legacy JavaScript polyfill* — el chunk `@next/polyfill-nomodule` (~13.8 KiB) lo incluye Next.js para compatibilidad con browsers muy viejos. Los browsers modernos lo descargan pero no lo ejecutan (`nomodule`). No se puede eliminar sin eyectar el build system.
- *Unused JavaScript en chunks propios* — el porcentaje "sin usar" en chunks de Next.js corresponde a event handlers que solo corren en interacción, no al cargar la página. Es comportamiento normal de React.
