'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth-provider';
import { LogoIcon } from '../brand-logo';
import { SITE_ORIGIN } from '../lib/site';
import { TurnstileWidget } from '../turnstile-widget';

type Mode = 'sign-in' | 'sign-up' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetTurnstile = useCallback(() => setTurnstileToken(''), []);

  useEffect(() => {
    if (!auth.session) return;
    const host = window.location.hostname;
    router.replace(host === 'app.inboxrhino.in' || host.endsWith('.chatgpt.site') ? '/' : '/console');
  }, [auth.session, router]);

  if (auth.session) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!turnstileToken) {
      setMessage('Complete the verification challenge first.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      if (mode === 'sign-in') {
        await auth.signInWithEmail(email, password, turnstileToken);
      } else if (mode === 'sign-up') {
        await auth.signUpWithEmail(email, password, turnstileToken);
        setMessage('Account created. Check your inbox to verify your email address.');
      } else {
        await auth.sendPasswordReset(email, turnstileToken);
        setMessage('If that address exists, a reset link has been sent.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed.');
      resetTurnstile();
    } finally {
      setSubmitting(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!turnstileToken) {
      setMessage('Complete the verification challenge first.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await auth.signInWithGoogle(turnstileToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
      resetTurnstile();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F1EA] px-4 py-10 text-[#1C1917]">
      <div className="w-full max-w-md rounded-[22px] border border-[#1C1917]/10 bg-white p-8 shadow-[0_8px_40px_rgba(28,25,23,0.08)]">
        <div className="mb-8 flex items-center gap-3">
          <LogoIcon size={40} priority />
          <div>
            <h1 className="text-lg font-bold tracking-[-0.02em]">Sign in</h1>
            <p className="text-sm text-stone-500">Sign in to your test inbox console</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          {(['sign-in', 'sign-up', 'reset'] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setMessage('');
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${mode === item ? 'bg-[#0F3D3E] text-white' : 'bg-stone-100 text-stone-600'}`}
            >
              {item.replace('-', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-[#0F3D3E]"
            />
          </label>
          {mode !== 'reset' ? (
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-[#0F3D3E]"
              />
            </label>
          ) : null}

          <TurnstileWidget onToken={setTurnstileToken} onExpire={resetTurnstile} />

          {message ? <p className="text-sm text-stone-700">{message}</p> : null}
          {auth.error ? <p className="text-sm text-red-700">{auth.error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#0F3D3E] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {mode !== 'reset' ? (
          <button
            type="button"
            disabled={submitting}
            onClick={signInWithGoogle}
            className="mt-3 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-800 disabled:opacity-60"
          >
            Continue with Google
          </button>
        ) : null}

        <p className="mt-6 text-center text-xs text-stone-500">
          By continuing you agree to use InboxRhino for testing only.{' '}
          <a href={SITE_ORIGIN} className="font-semibold text-[#0F3D3E]">
            InboxRhino home
          </a>
          {' · '}
          <a href={`${SITE_ORIGIN}/legal`} className="font-semibold text-[#0F3D3E]">
            Privacy and terms
          </a>
        </p>
      </div>
    </main>
  );
}
