export interface AuthCredentials {
  token: string;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}
