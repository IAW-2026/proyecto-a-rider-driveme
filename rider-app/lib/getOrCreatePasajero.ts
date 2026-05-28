import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function getOrCreatePasajero() {
  const user = await currentUser()
  if (!user) return null

  const email = user.emailAddresses[0]?.emailAddress ?? ""
  const nombre = [user.firstName, user.lastName].filter(Boolean).join(" ") || email.split("@")[0]

  return prisma.pasajero.upsert({
    where: { clerkId: user.id },
    update: {},
    create: {
      clerkId: user.id,
      email,
      nombre,
    },
  })
}
