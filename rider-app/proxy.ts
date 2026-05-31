import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  // Public API endpoints used by client without auth
  "/api/geocoding(.*)",
  "/api/solicitudes(.*)",
  "/api/viajes(.*)",
  "/api/notificaciones(.*)",
  "/api/pasajeros(.*)",
  "/api/pasajero/reputacion(.*)",
  "/api/conductores(.*)",
  "/api/auth/me(.*)",
  "/api/direcciones(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))(?:.*)|api|trpc)(.*)"],
};
