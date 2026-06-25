"use client"

import { usePathname } from "next/navigation"
import { SpaceshipLayer } from "./SpaceshipLayer"

export function SpaceshipLayerWrapper() {
  const pathname = usePathname()
  if (pathname === "/" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null
  return <SpaceshipLayer />
}
