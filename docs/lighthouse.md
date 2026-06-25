# Hallazgos de Lighthouse

Registro de advertencias que marca Lighthouse al correr las pruebas. Estas advertencias quedan fuera del alcance del proyecto ya que son generadas por dependencias externas.

## Clerk (proveedor de autenticación)

- *Reduce unused JavaScript* — los bundles `clerk.browser.js`, `ui.browser.js`, `vendors_ui_*.js` (~290 KiB) los sirve Clerk desde su CDN. No se puede modificar su tamaño ni estructura.
- *Third-party cookies* — `__cf_bm` y `_cfuvid` son cookies de Cloudflare inyectadas automáticamente por la infraestructura de Clerk (bot management y rate limiting).
- *Imagen de avatar en JPEG/PNG* — el avatar lo sirve `img.clerk.com` sin soporte WebP/AVIF. No se puede cambiar el formato del CDN de Clerk.
- *Cache TTL bajo en img.clerk.com* — Clerk fija el TTL en 1 día. No se puede modificar el `Cache-Control` de un servidor externo.
- *Animaciones no compuestas* — Clerk anima `max-height` en sus componentes internos (`cl-internal-*`). Es código de Clerk, no del proyecto.
- *Back/forward cache (4 motivos)* — el bfcache queda bloqueado por razones fuera del alcance: los bundles JS de Clerk se sirven con `Cache-Control: no-store`, un error interno del navegador, y la página `/inicio` recibe `no-store` de Next.js/Vercel al ser dinámica.

## Next.js internals

- *Legacy JavaScript polyfill* — el chunk `@next/polyfill-nomodule` (~13.8 KiB) lo incluye Next.js para compatibilidad con browsers muy viejos. Los browsers modernos lo descargan pero no lo ejecutan (`nomodule`). No se puede eliminar sin eyectar el build system.
- *Unused JavaScript en chunks propios* — el porcentaje "sin usar" en chunks de Next.js corresponde a event handlers que solo corren en interacción, no al cargar la página. Es comportamiento normal de React.
- *Reduce JavaScript / Unused JS en modo dev* — los chunks `next-devtools_index` (~213 KiB) y similares solo existen en `npm run dev`. En el build de producción (Vercel) no se incluyen.

## Leaflet / OpenStreetMap (página `/viaje-activo`)

- *Cache TTL bajo en tiles de OSM* — los tiles de `*.tile.openstreetmap.org` se sirven con TTL de 3–11 horas. Es un límite impuesto por los servidores de OpenStreetMap; no es configurable desde el proyecto.
- *Imágenes en formato PNG (no WebP/AVIF)* — OSM solo sirve tiles en PNG. Cambiar el formato requeriría usar un tile server propio o de pago.
- *Tiles de baja resolución en pantallas retina* — OSM sirve tiles de 256×256 px. En dispositivos con DPR > 1 Lighthouse espera 384×384 px. El CDN gratuito de OSM no ofrece tiles `@2x`.
- *Marker shadow de baja resolución* — el asset `marker-shadow.png` viene del bundle de Leaflet empaquetado por Next.js. No tiene versión retina.
- *LCP es un tile de Leaflet* — Leaflet carga los tiles vía JavaScript (`dynamic` con `ssr: false`), por lo que Lighthouse detecta un tile como elemento LCP con alto "resource load delay". Inherente al funcionamiento de Leaflet en el cliente.
- *Back/forward cache bloqueado por WebSocket* — la página `/viaje-activo` usa WebSocket, lo que inhabilita el bfcache por política del browser.

## Modo desarrollo (solo afecta auditorías corridas en `localhost`)

- *Source maps sin campo `mappings`* — los chunks generados por Turbopack en dev producen mapas de orígenes incompletos. En el build de producción son correctos o se omiten.
- *Extensiones de Chrome en el reporte* — Lighthouse puede capturar actividad de extensiones instaladas. No forman parte de la app.
- *CSS de bloqueo de renderización* — Turbopack emite un bundle CSS único en dev que bloquea la renderización inicial. En producción Next.js divide e inyecta el CSS crítico de forma distinta.
- *LCP con alto "retraso en la renderización"* — en dev el delay es causado principalmente por el CSS de bloqueo. En producción el LCP de `/viaje-activo` es un tile de Leaflet.
