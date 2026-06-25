"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    let mounted = true
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (mounted && d.role === "admin") setIsAdmin(true) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])
  if (!isAdmin) return null
  return (
    <div className="ml-4">
      <Link href="/admin" className="inline-flex items-center rounded-full border border-zinc-700 bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">
        Admin
      </Link>
    </div>
  )
}
