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

### Administrador

| Campo | Valor |
|-------|-------|
| Usuario | `accesoAdmin` |
| Contraseña | `IAW2026admin` |

El panel de administración está disponible en `/admin` — solo accesible con la cuenta de administrador.

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
- *Back/forward cache (razones 2 y 3)* — los bundles JS de Clerk se sirven con `Cache-Control: no-store`, lo que impide el bfcache independientemente de nuestra configuración.

**Next.js internals**
- *Legacy JavaScript polyfill* — el chunk `@next/polyfill-nomodule` (~13.8 KiB) lo incluye Next.js para compatibilidad con browsers muy viejos. Los browsers modernos lo descargan pero no lo ejecutan (`nomodule`). No se puede eliminar sin eyectar el build system.
- *Unused JavaScript en chunks propios* — el porcentaje "sin usar" en chunks de Next.js corresponde a event handlers que solo corren en interacción, no al cargar la página. Es comportamiento normal de React.
