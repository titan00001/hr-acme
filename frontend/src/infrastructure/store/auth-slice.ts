import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthCredentials, AuthState } from '@/domain/types/auth.types';

export const AUTH_TOKEN_KEY = 'acme_hr_token';

function loadToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function createInitialState(): AuthState {
  const token = loadToken();

  return {
    token,
    isAuthenticated: token !== null,
  };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: createInitialState(),
  reducers: {
    setCredentials(state, action: PayloadAction<AuthCredentials>): void {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
    },
    logout(state): void {
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(AUTH_TOKEN_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
