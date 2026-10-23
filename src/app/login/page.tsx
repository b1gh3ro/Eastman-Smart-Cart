import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <div className="container-page flex justify-center py-12">
      <Suspense fallback={<div className="card h-96 w-full max-w-md animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
