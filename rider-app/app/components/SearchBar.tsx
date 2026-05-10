'use client';

import { useState } from 'react';

type Props = {
  placeholder?: string;
  onSearch?: (q: string) => void;
};

export default function SearchBar({ placeholder = 'Próximo salto intergaláctico', onSearch }: Props) {
  const [q, setQ] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQ(v);
    onSearch?.(v);
  }

  return (
    <div className="w-full">
      <label className="sr-only">Buscar galaxias</label>
      <div className="relative flex w-full items-center gap-3">
        <input
          value={q}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-800 bg-[#070707] py-3 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
        <button
          type="button"
          onClick={() => onSearch?.(q)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95"
        >
          Saltar
        </button>
      </div>
    </div>
  );
}
