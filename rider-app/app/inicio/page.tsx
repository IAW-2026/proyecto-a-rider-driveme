'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';
import SearchBar from '../components/SearchBar';
import GalaxyCard from '../components/GalaxyCard';

export default function InicioPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [query, setQuery] = useState('');

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-zinc-400">Cargando...</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg text-zinc-400">No estás autenticado.</p>
          <Link href="/sign-in" className="mt-4 inline-block text-red-500 hover:text-red-400">
            Ir al login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Bienvenido, {user?.firstName || user?.emailAddresses[0]?.emailAddress}</h1>
            <p className="text-sm text-zinc-400">Gestiona tus viajes intergalácticos</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.imageUrl && (
              <img src={user.imageUrl} alt="Avatar" className="h-10 w-10 rounded-full" />
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full px-4 py-16 sm:px-6 lg:px-8">
        {/* Galaxias más visitadas + buscador */}
        <section className="mb-16 max-w-7xl mx-auto">
          <div className="mb-8 flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Galaxias más visitadas</h2>
              <p className="mt-2 text-3xl sm:text-4xl font-bold text-white">Explora tus destinos favoritos</p>
            </div>
            <div className="w-full lg:max-w-md">
              <SearchBar placeholder="Próximo salto intergaláctico" onSearch={(q) => setQuery(q)} />
            </div>
          </div>

          {/* Grid de galaxias */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Andrómeda', visits: 128, image: '/andromeda.jpg' },
              { name: 'Tatooine', visits: 94, image: '/tatooine.jpg' },
              { name: 'Kessel', visits: 72, image: '/kessel.jpg' },
              { name: 'Hoth', visits: 68, image: '/hoth.jpg' },
              { name: 'Dagobah', visits: 55, image: '/dagobah.jpg' },
              { name: 'Coruscant', visits: 43, image: '/coruscant.jpg' },
            ]
              .filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase()))
              .map((g) => (
                <GalaxyCard key={g.name} name={g.name} visits={g.visits} image={g.image} />
              ))}
          </div>
        </section>

        {/* Crear nuevo viaje */}
        <section className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-black/60 to-black/30 p-10 sm:p-12">
            <div className="mb-10">
              <h3 className="text-3xl sm:text-4xl font-bold text-white">Crear Nuevo Viaje</h3>
              <p className="mt-2 text-zinc-400">Lanza tu próxima aventura galáctica</p>
            </div>

            <form className="space-y-8">
              <div>
                <label className="block text-base font-semibold text-white mb-3">
                  Destino
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tatooine, Kessel, Coruscant..."
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-5 py-4 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold text-white mb-3">
                    Pasajeros
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    placeholder="1"
                    className="w-full rounded-xl border border-zinc-700 bg-black/40 px-5 py-4 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold text-white mb-3">
                    Precio (créditos)
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full rounded-xl border border-zinc-700 bg-black/40 px-5 py-4 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-white mb-3">
                  Descripción
                </label>
                <textarea
                  placeholder="Describe los detalles del viaje, horarios, paradas, etc..."
                  rows={4}
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-5 py-4 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:brightness-110 transition-all duration-200"
              >
                Iniciar Viaje
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
