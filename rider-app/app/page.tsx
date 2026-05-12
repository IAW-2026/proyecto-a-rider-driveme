'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignIn, UserButton, useUser } from '@clerk/nextjs';
import clerkAppearance from '../lib/clerkAppearance';

export default function Home() {
  const [started, setStarted] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/inicio');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Static background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_40%_-10%,rgba(120,0,0,0.28),transparent),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(60,0,110,0.15),transparent)]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:34px_34px]" />

      {/* Neon blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Violet */}
        <div className="absolute h-[28rem] w-[28rem] rounded-full blur-[90px]"
          style={{ left: '22%', top: '38%', translate: '-50% -50%', background: 'radial-gradient(circle, rgba(120,40,255,0.55), transparent 70%)', animation: 'neonDrift1 18s ease-in-out infinite' }} />
        {/* Pink */}
        <div className="absolute h-[24rem] w-[24rem] rounded-full blur-[85px]"
          style={{ left: '68%', top: '52%', translate: '-50% -50%', background: 'radial-gradient(circle, rgba(255,50,180,0.5), transparent 70%)', animation: 'neonDrift2 23s ease-in-out infinite' }} />
        {/* Red */}
        <div className="absolute h-[22rem] w-[22rem] rounded-full blur-[80px]"
          style={{ left: '48%', top: '72%', translate: '-50% -50%', background: 'radial-gradient(circle, rgba(255,20,20,0.5), transparent 70%)', animation: 'neonDrift3 16s ease-in-out infinite' }} />
        {/* Green */}
        <div className="absolute h-[20rem] w-[20rem] rounded-full blur-[80px]"
          style={{ left: '14%', top: '22%', translate: '-50% -50%', background: 'radial-gradient(circle, rgba(30,220,100,0.45), transparent 70%)', animation: 'neonDrift4 26s ease-in-out infinite' }} />
        {/* Blue */}
        <div className="absolute h-[26rem] w-[26rem] rounded-full blur-[90px]"
          style={{ left: '82%', top: '28%', translate: '-50% -50%', background: 'radial-gradient(circle, rgba(30,100,255,0.5), transparent 70%)', animation: 'neonDrift5 21s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-14">

          {/* Vader — slides left when started */}
          <div
            className={`flex-shrink-0 transition-transform duration-700 ease-out ${
              started ? 'lg:-translate-x-10' : ''
            }`}
          >
            <Image
              src="/vader.png"
              alt="Vader"
              width={960}
              height={960}
              className="h-auto w-[clamp(22rem,min(52vw,calc(100vh-7rem)),60rem)] object-contain drop-shadow-[0_0_55px_rgba(140,0,0,0.8)] drop-shadow-[0_8px_40px_rgba(0,0,0,0.9)]"
            />
          </div>

          {/* Right panel — expands from small pill to full Clerk card */}
          <div
            className={`flex-shrink-0 overflow-hidden rounded-2xl border border-violet-900/40 backdrop-blur-xl transition-all duration-700 ease-out ${
              started ? 'w-full p-6 lg:w-[28rem]' : 'w-56 p-5'
            }`}
            style={{
              transform: 'perspective(1100px) rotateY(-6deg) rotateX(2deg)',
              transformOrigin: 'center center',
              background: 'linear-gradient(160deg, rgba(30,24,48,0.94) 0%, rgba(16,12,28,0.97) 45%, rgba(6,5,10,0.99) 100%)',
              boxShadow: '10px 18px 55px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05), -5px -5px 25px rgba(100,0,220,0.15), 5px 5px 20px rgba(180,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.09), inset 1px 0 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Button — collapses out */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                started ? 'max-h-0 opacity-0' : 'max-h-40 opacity-100'
              }`}
            >
              <div className="flex flex-col items-center gap-3 pb-1">
                <span className="text-[0.6rem] uppercase tracking-[0.45em] text-red-400/60">
                  Imperio galáctico
                </span>
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-500/40 bg-gradient-to-r from-red-950 via-red-800 to-orange-950 px-5 text-[0.65rem] font-bold tracking-[0.3em] text-white shadow-[0_0_28px_rgba(127,29,29,0.5)] transition hover:scale-[1.02] hover:border-red-300/70 hover:shadow-[0_0_42px_rgba(180,50,50,0.45)] focus:outline-none focus:ring-2 focus:ring-red-400/60"
                >
                  INICIAR VIAJE
                </button>
              </div>
            </div>

            {/* Clerk form — expands into view */}
            <div
              className={`overflow-hidden transition-all duration-500 delay-300 ease-out ${
                started ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.45em] text-red-400/60">Acceso galáctico</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Imperio · Login</h2>
                </div>
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
              </div>

              {isSignedIn ? (
                <div className="space-y-4 rounded-xl border border-red-950/35 bg-black/40 p-4">
                  <p className="text-sm leading-6 text-zinc-400">
                    Sesión activa. Accede a tu panel.
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/inicio"
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-500/40 bg-gradient-to-r from-red-950 via-red-800 to-orange-950 px-5 text-xs font-semibold tracking-widest text-white shadow-[0_0_24px_rgba(127,29,29,0.45)] transition hover:scale-[1.02] hover:border-red-300/70"
                    >
                      IR A VIAJES
                    </Link>
                    <div className="rounded-full border border-red-950/30 bg-black/40 p-1">
                      <UserButton />
                    </div>
                  </div>
                </div>
              ) : (
                <SignIn appearance={clerkAppearance} forceRedirectUrl="/inicio" />
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
