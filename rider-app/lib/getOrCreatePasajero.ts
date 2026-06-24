import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function getOrCreatePasajero() {
  const user = await currentUser()
  if (!user) return null

  const email = user.emailAddresses[0]?.emailAddress ?? ""
  const nombre = [user.firstName, user.lastName].filter(Boolean).join(" ") || email.split("@")[0]

  let pasajero
  try {
    pasajero = await prisma.pasajero.upsert({
      where: { clerkId: user.id },
      update: {},
      create: {
        clerkId: user.id,
        email,
        nombre,
      },
    })
  } catch (e) {
    // Si ya existe un pasajero con ese email (ej: del seed), vincular el clerkId
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      pasajero = await prisma.pasajero.update({
        where: { email },
        data: { clerkId: user.id, nombre },
      })
    } else {
      throw e
    }
  }

  // Backfill: si el usuario tiene perfil completo pero no tiene rol en Clerk, setearlo
  if (!user.publicMetadata?.role && pasajero.telefono) {
    const client = await clerkClient()
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: { role: "rider" },
    })
  }

  return pasajero
}

