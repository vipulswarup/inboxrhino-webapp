'use client';

import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createConsoleSession, type SessionResponse } from './lib/console-api';
import { firebaseAuth } from './lib/firebase';

type AuthState = {
  firebaseUser: User | null;
  session: SessionResponse | null;
  loading: boolean;
  error: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getSensitiveActionToken: () => Promise<string>;
  signInWithGoogle: (turnstileToken: string) => Promise<void>;
  signInWithEmail: (email: string, password: string, turnstileToken: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, turnstileToken: string) => Promise<void>;
  sendPasswordReset: (email: string, turnstileToken: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const RECENT_AUTH_SECONDS = 10 * 60;

async function tokenAuthTime(user: User) {
  const tokenResult = await user.getIdTokenResult();
  return Number(tokenResult.claims.auth_time ?? 0);
}

async function ensureRecentFirebaseAuth(user: User) {
  const authTime = await tokenAuthTime(user);
  const cutoff = Math.floor(Date.now() / 1000) - RECENT_AUTH_SECONDS;
  if (authTime >= cutoff) return;

  const providerId = user.providerData.find((provider) => provider.providerId)?.providerId;
  if (providerId === 'google.com') {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
    return;
  }
  if (providerId === 'password') {
    const email = user.email;
    if (!email) throw new Error('Sign out and sign in again to perform this action.');
    const password = window.prompt('Confirm your password to create or revoke an API key.');
    if (!password) throw new Error('Password confirmation is required.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, password));
    return;
  }
  throw new Error('Sign out and sign in again to perform this action.');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingTurnstileRef = useRef<string | null>(null);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Not signed in.');
    return user.getIdToken(forceRefresh);
  }, []);

  const bootstrapFromUser = useCallback(async (user: User) => {
    const idToken = await user.getIdToken(true);
    const turnstileToken = pendingTurnstileRef.current ?? undefined;
    const nextSession = await createConsoleSession(idToken, turnstileToken);
    pendingTurnstileRef.current = null;
    setSession(nextSession);
    setError(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Sign in again to refresh your session.');
    await bootstrapFromUser(user);
  }, [bootstrapFromUser]);

  const getSensitiveActionToken = useCallback(async () => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Not signed in.');
    await ensureRecentFirebaseAuth(user);
    return user.getIdToken(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setSession(null);
        pendingTurnstileRef.current = null;
        setLoading(false);
        return;
      }
      setLoading(true);
      void bootstrapFromUser(user)
        .catch((caught) => {
          setSession(null);
          setError(caught instanceof Error ? caught.message : 'Session could not be established.');
        })
        .finally(() => setLoading(false));
    });
    return unsubscribe;
  }, [bootstrapFromUser]);

  const signInWithGoogle = useCallback(async (turnstileToken: string) => {
    setError(null);
    pendingTurnstileRef.current = turnstileToken;
    await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string, turnstileToken: string) => {
    setError(null);
    pendingTurnstileRef.current = turnstileToken;
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, turnstileToken: string) => {
    setError(null);
    pendingTurnstileRef.current = turnstileToken;
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await sendEmailVerification(credential.user);
  }, []);

  const sendPasswordReset = useCallback(async (email: string, turnstileToken: string) => {
    setError(null);
    pendingTurnstileRef.current = turnstileToken;
    await sendPasswordResetEmail(firebaseAuth, email);
  }, []);

  const resendVerification = useCallback(async () => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Not signed in.');
    await sendEmailVerification(user);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(firebaseAuth);
    setSession(null);
    pendingTurnstileRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      session,
      loading,
      error,
      getIdToken,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      resendVerification,
      refreshSession,
      getSensitiveActionToken,
      signOutUser,
    }),
    [
      firebaseUser,
      session,
      loading,
      error,
      getIdToken,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      resendVerification,
      refreshSession,
      getSensitiveActionToken,
      signOutUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
