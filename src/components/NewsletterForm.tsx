'use client';

import { useState } from 'react';
import { api, errorMessage } from '@/lib/api-client';

// Sends the email to POST /api/newsletter and shows what the server said.
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; message?: string }>({ status: 'idle' });

  return (
    <form
      className="mt-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ status: 'sending' });
        try {
          await api.subscribe(email);
          setState({ status: 'done', message: 'You’re subscribed. Watch your inbox for deals.' });
          setEmail('');
        } catch (err) {
          setState({ status: 'error', message: errorMessage(err) });
        }
      }}
    >
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="field !h-11 min-w-0 flex-1"
        />
        <button className="btn-primary !min-h-11 shrink-0" disabled={state.status === 'sending' || !email.trim()}>
          {state.status === 'sending' ? 'Joining…' : 'Join'}
        </button>
      </div>
      {state.message && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className={`mt-2 text-body-sm ${state.status === 'error' ? 'text-error' : 'text-tertiary'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
