'use client';

import { SignIn } from '@clerk/nextjs';
import clerkAppearance from '../../../lib/clerkAppearance';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Acceso</h1>
          <p className="mt-1 text-sm text-zinc-400">Inicia sesión para continuar con tu próximo salto.</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-black/60 to-black/50 p-6">
          <SignIn appearance={clerkAppearance} routing="path" path="/sign-in" />
        </div>
      </div>
    </main>
  );
}
