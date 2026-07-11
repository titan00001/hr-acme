export interface AuthCredentials {
  token: string;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}

/** Mirrors backend LoginRequestDto */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Mirrors backend LoginResponseDto */
export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}
