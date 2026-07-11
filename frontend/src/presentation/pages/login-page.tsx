import React from 'react';

export function LoginPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="animate-slide-up w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-md">
        <p className="mb-2 text-sm font-medium tracking-wide text-brand uppercase">
          ACME HR
        </p>
        <h1 className="font-display text-3xl text-ink">Login</h1>
        <p className="mt-3 text-base text-ink-muted">
          Authentication UI arrives in M3.2.
        </p>
        <div className="mt-8 flex gap-3">
          <span className="h-2 w-8 rounded-full bg-brand" />
          <span className="h-2 w-8 rounded-full bg-accent" />
          <span className="h-2 w-8 rounded-full bg-border-strong" />
        </div>
      </section>
    </main>
  );
}
