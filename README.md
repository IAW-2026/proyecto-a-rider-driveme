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

> **Nota sobre mobile:** el panel de administración está pensado para uso en desktop. Las tablas de pasajeros, solicitudes y viajes tienen scroll horizontal en mobile (se puede deslizar), pero el layout general no está optimizado para pantallas pequeñas. No encontré una forma satisfactoria de reorganizar la información densa de las tablas en mobile sin perder legibilidad, por lo que se dejó con scroll como solución funcional.

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
- *Reduce JavaScript / Unused JS en modo dev* — los chunks `next-devtools_index` (~213 KiB) y similares solo existen en `npm run dev`. En el build de producción (Vercel) no se incluyen.

**Leaflet / OpenStreetMap (página `/viaje-activo`)**
- *Cache TTL bajo en tiles de OSM* — los tiles de `*.tile.openstreetmap.org` se sirven con TTL de 3–11 horas. Es un límite impuesto por los servidores de OpenStreetMap; no es configurable desde el proyecto.
- *Imágenes en formato PNG (no WebP/AVIF)* — OSM solo sirve tiles en PNG. Cambiar el formato requeriría usar un tile server propio o de pago que transponga a WebP, lo cual está fuera del alcance del proyecto.
- *Tiles de baja resolución en pantallas retina* — OSM sirve tiles de 256×256 px. En dispositivos con DPR > 1 Lighthouse espera 384×384 px. El CDN gratuito de OSM no ofrece tiles `@2x`; sería necesario un tile server de pago (Mapbox, etc.) para resolverlo.
- *Marker shadow de baja resolución* — el asset `marker-shadow.png` viene del bundle de Leaflet empaquetado por Next.js. No tiene versión retina; habría que reemplazar los íconos por defecto de Leaflet con assets propios.
- *LCP es un tile de Leaflet* — Leaflet carga los tiles del mapa vía JavaScript (`dynamic` con `ssr: false`), por lo que Lighthouse detecta un tile como elemento LCP con alto "resource load delay". Esto es inherente al funcionamiento de Leaflet en el client: los tiles no se pueden pre-cargar desde el HTML sin un servidor de tiles propio.
- *Back/forward cache bloqueado por WebSocket* — la página `/viaje-activo` usa WebSocket (a través de Clerk o Next.js internals), lo que inhabilita el bfcache por política del browser. No es modificable sin eliminar la funcionalidad de autenticación en tiempo real.

**Modo desarrollo (solo afecta auditorías corridas en `localhost`)**
- *Source maps sin campo `mappings`* — los chunks generados por Turbopack en dev (`node_modules_next_dist_*`, `turbopack-*`, etc.) producen mapas de orígenes incompletos. En el build de producción (`next build`) los source maps son correctos o se omiten según la configuración. No afecta al deploy en Vercel.
- *Extensiones de Chrome en el reporte* — Lighthouse puede capturar actividad de extensiones instaladas (`chrome-extension://...`). Estos recursos no forman parte de la app y no aparecen en producción.
- *CSS de bloqueo de renderización* — Turbopack emite un bundle CSS único (`[root-of...]__*.css`, ~18 KiB) que bloquea la renderización inicial (~300 ms). En el build de producción Next.js divide e inyecta el CSS crítico de forma distinta, por lo que este bloqueo desaparece.
- *LCP con alto "retraso en la renderización"* — en dev, el elemento LCP suele ser un `<h1>` de texto con un delay de ~3 segundos causado principalmente por el CSS de bloqueo mencionado arriba. En producción el LCP de la página `/viaje-activo` es un tile de Leaflet (documentado en la sección anterior), no un elemento de texto.
