'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './auth-provider';
import { ConsoleApp } from './console-app';

export function ConsoleHome() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.firebaseUser) router.replace('/login');
  }, [auth.firebaseUser, auth.loading, router]);

  if (auth.loading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F1EA] text-sm text-stone-600">Loading…</main>;
  }

  if (!auth.firebaseUser) return null;

  if (!auth.session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F4F1EA] px-4">
        <div className="w-full max-w-md rounded-[22px] border border-[#1C1917]/10 bg-white p-8 text-center shadow-[0_8px_40px_rgba(28,25,23,0.08)]">
          <h1 className="text-xl font-bold">Could not open the console</h1>
          <p className="mt-2 text-sm text-stone-600">{auth.error ?? 'Your session could not be restored.'}</p>
          <Link href="/login" className="mt-6 inline-block rounded-lg bg-[#0F3D3E] px-4 py-2.5 text-sm font-bold text-white">
            Sign in again
          </Link>
        </div>
      </main>
    );
  }

  return <ConsoleApp />;
}
