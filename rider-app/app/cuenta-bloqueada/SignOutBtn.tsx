"use client"
import { SignOutButton } from "@clerk/nextjs"

export function SignOutBtn() {
  return (
    <SignOutButton redirectUrl="/sign-in">
      <button className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border/40 text-muted-foreground text-sm font-medium transition hover:bg-muted/20 cursor-pointer">
        Cerrar sesión
      </button>
    </SignOutButton>
  )
}
