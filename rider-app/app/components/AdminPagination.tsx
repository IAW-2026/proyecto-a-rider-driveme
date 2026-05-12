import Link from "next/link"

interface Props {
  page: number
  totalPages: number
  basePath: string
  searchParams: Record<string, string>
}

export default function AdminPagination({ page, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null

  function url(p: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(p) })
    return `${basePath}?${params.toString()}`
  }

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between pt-6 border-t border-zinc-800">
      <p className="text-sm text-zinc-500">
        Página <span className="text-zinc-300">{page}</span> de <span className="text-zinc-300">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={url(page - 1)}
            className="rounded-xl border border-zinc-700 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-white/10"
          >
            ← Anterior
          </Link>
        ) : (
          <span className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-600 cursor-not-allowed">
            ← Anterior
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={url(page + 1)}
            className="rounded-xl border border-zinc-700 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-white/10"
          >
            Siguiente →
          </Link>
        ) : (
          <span className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-600 cursor-not-allowed">
            Siguiente →
          </span>
        )}
      </div>
    </nav>
  )
}
