import { redirect } from "next/navigation"
import { getOrCreatePasajero } from "./getOrCreatePasajero"

export async function requirePasajeroActivo() {
  const pasajero = await getOrCreatePasajero()
  if (!pasajero) redirect("/sign-in")
  if (!pasajero.activo) redirect("/cuenta-bloqueada")
  return pasajero
}
