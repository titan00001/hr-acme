import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { AUTH_TOKEN_KEY } from '@/infrastructure/store/auth-slice';

describe('App', () => {
  it('redirects unauthenticated users to the login page', () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);

    render(<App />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});
