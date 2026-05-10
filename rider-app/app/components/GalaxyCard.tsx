'use client';

type Props = {
  name: string;
  visits?: number;
  image?: string;
};

export default function GalaxyCard({ name, visits = 0, image }: Props) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-gradient-to-b from-black/40 to-black/30 p-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">✦</div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold leading-5">{name}</h3>
          <p className="truncate text-xs text-zinc-400">{visits} visitas</p>
        </div>
      </div>
      <div className="mt-1">
        <button className="inline-flex items-center gap-2 rounded-md bg-red-600/90 px-3 py-1 text-xs font-medium text-white hover:brightness-95">
          Saltar a la galaxia
        </button>
      </div>
    </article>
  );
}
