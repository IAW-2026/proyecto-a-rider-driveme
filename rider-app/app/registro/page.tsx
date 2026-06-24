import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import RegistroForm from "./RegistroForm"

export default async function RegistroPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await currentUser()
  if (user?.publicMetadata?.role === "rider") redirect("/inicio")

  return (
    <main className="min-h-screen bg-background stars-bg relative flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1
            className="text-xl font-bold text-foreground tracking-widest"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            COMPLETÁ TU PERFIL
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Antes de empezar, necesitamos algunos datos tuyos.
          </p>
        </div>

        <RegistroForm />
      </div>
    </main>
  )
}
