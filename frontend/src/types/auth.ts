export interface User {
  id: number;
  email: string;
  username: string;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export interface ValidationError {
  field: string;
  message: string;
}
