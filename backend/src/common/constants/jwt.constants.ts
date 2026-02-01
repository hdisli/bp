import { ConfigService } from '@nestjs/config';

const DEV_SECRET_FALLBACK = 'dev-secret-key-change-in-production';

export function getJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  const nodeEnv = configService.get<string>('NODE_ENV');

  if (!secret || secret === DEV_SECRET_FALLBACK) {
    if (nodeEnv === 'production') {
      throw new Error(
        'JWT_SECRET environment variable must be set to a secure value in production',
      );
    }
  }

  return secret || DEV_SECRET_FALLBACK;
}
