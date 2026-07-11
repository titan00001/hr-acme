import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { baseApi } from '@/infrastructure/api/base-api';
import { ProtectedRoute } from '@/infrastructure/routing/protected-route';
import {
  AUTH_TOKEN_KEY,
  authReducer,
  setCredentials,
} from '@/infrastructure/store/auth-slice';

function createTestStore(authenticated: boolean) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  if (authenticated) {
    store.dispatch(setCredentials({ token: 'test-token' }));
  }

  return store;
}

function renderProtectedRoute(authenticated: boolean): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);

  const store = createTestStore(authenticated);

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<h1>Login</h1>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects to login when unauthenticated', () => {
    renderProtectedRoute(false);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    renderProtectedRoute(true);

    expect(
      screen.getByRole('heading', { name: /dashboard/i }),
    ).toBeInTheDocument();
  });
});
