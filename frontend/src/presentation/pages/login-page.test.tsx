import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { baseApi } from '@/infrastructure/api/base-api';
import { authReducer } from '@/infrastructure/store/auth-slice';
import { LoginPage } from '@/presentation/pages/login-page';

const loginMock = vi.fn();

vi.mock('@/infrastructure/api/auth-api', () => ({
  useLoginMutation: () => [
    loginMock,
    { isLoading: false, error: undefined, reset: vi.fn() },
  ],
}));

function renderLoginPage() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('navigates to dashboard after a successful login', async () => {
    const user = userEvent.setup();
    loginMock.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ accessToken: 'jwt-token', expiresIn: 28800 }),
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'changeme');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /dashboard/i }),
      ).toBeInTheDocument();
    });
  });
});
