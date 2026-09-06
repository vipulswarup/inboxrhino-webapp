'use client';

import { AuthProvider } from './auth-provider';

export function ConsoleProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
