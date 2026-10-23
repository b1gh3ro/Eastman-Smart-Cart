'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/providers/FeedbackProvider';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import { api, errorMessage } from '@/lib/api-client';

// Only allow going back to a page on this site after login.
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

export default function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { refreshMe } = useStore();
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signup') {
        const result = await api.signup(name, email, password);
        if (result.needsConfirmation) {
          setInfo('Account created. Check your email to confirm it, then log in.');
          setMode('login');
          return;
        }
      } else {
        await api.login(email, password);
      }
      const user = await refreshMe();
      if (!user) throw new Error('Logged in, but the session could not be loaded. Please try again.');
      toast('success', mode === 'signup' ? 'Welcome! Your account is ready.' : `Welcome back${user.name ? `, ${user.name}` : ''}!`);
      router.push(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const tab = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-label-md transition-all ${active ? 'bg-white text-on-surface shadow-sm' : 'text-secondary hover:text-on-surface'}`;

  return (
    <div className="card w-full max-w-md p-6 md:p-8">
      <h1 className="font-display text-headline-md">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="mt-1 text-body-sm text-on-surface-variant">Your cart, wishlist and orders are saved to your account.</p>

      <div className="mt-6 flex rounded-xl bg-surface-container-low p-1" role="tablist">
        <button role="tab" aria-selected={mode === 'login'} className={tab(mode === 'login')} onClick={() => setMode('login')}>
          Log in
        </button>
        <button role="tab" aria-selected={mode === 'signup'} className={tab(mode === 'signup')} onClick={() => setMode('signup')}>
          Sign up
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'signup' && (
          <label className="block">
            <span className="mb-1.5 block text-label-md">Name</span>
            <input className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-label-md">Email</span>
          <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-label-md">Password</span>
          <input
            className="field"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#fff1f2] px-4 py-3 text-body-sm text-on-error-container">
            <Icon name="error" className="mt-0.5 text-[16px]" /> {error}
          </p>
        )}
        {info && (
          <p role="status" className="flex items-start gap-2 rounded-xl bg-[#ecfdf5] px-4 py-3 text-body-sm text-on-tertiary-fixed-variant">
            <Icon name="mail" className="mt-0.5 text-[16px]" /> {info}
          </p>
        )}

        <button className="btn-primary w-full" disabled={pending}>
          {pending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
