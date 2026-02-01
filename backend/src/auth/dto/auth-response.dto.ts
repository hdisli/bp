export class AuthUserDto {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
}

export class AuthResponseDto {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class ApiResponseDto<T> {
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
