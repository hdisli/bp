import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { getJwtSecret } from '../common/constants/jwt.constants';

interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'NO_TOKEN',
        message: 'No authentication token provided',
        statusCode: 401,
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: getJwtSecret(this.configService),
      });

      // Attach user payload to request
      request['user'] = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      };

      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
          statusCode: 401,
        });
      }

      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        statusCode: 401,
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
