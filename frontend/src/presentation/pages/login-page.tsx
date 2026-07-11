import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import type { LoginFormValues } from '@/domain/schemas/login-form.schema';
import { useLoginMutation } from '@/infrastructure/api/auth-api';
import { extractApiError } from '@/infrastructure/api/extract-api-error';
import { useAppDispatch, useAppSelector } from '@/infrastructure/store/hooks';
import { setCredentials } from '@/infrastructure/store/auth-slice';
import { LoginForm } from '@/presentation/components/auth/login-form';

function getLoginErrorMessage(error: unknown): string {
  if (extractApiError(error).status === 401) {
    return 'Invalid username or password.';
  }

  return 'Unable to sign in. Please try again.';
}

export function LoginPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [login, { isLoading, error, reset }] = useLoginMutation();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(values: LoginFormValues): Promise<void> {
    reset();

    try {
      const result = await login(values).unwrap();
      dispatch(setCredentials({ token: result.accessToken }));
      void navigate('/dashboard');
    } catch {
      // Error surfaced via mutation `error` → serverError prop
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="animate-slide-up w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-md">
        <p className="mb-2 text-sm font-medium tracking-wide text-brand uppercase">
          ACME HR
        </p>
        <h1 className="font-display text-3xl text-ink">Sign in</h1>
        <p className="mt-2 text-base text-ink-muted">
          Enter your HR Manager credentials to continue.
        </p>

        <div className="mt-8">
          <LoginForm
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
            serverError={error ? getLoginErrorMessage(error) : null}
          />
        </div>
      </section>
    </main>
  );
}
