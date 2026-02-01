import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-xsrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function parseCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? match.trim().substring(name.length + 1) : undefined;
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const cookieHeader = req.headers.cookie;
    const existingToken = parseCookie(cookieHeader, CSRF_COOKIE_NAME);

    // Always set CSRF cookie if not present
    if (!existingToken) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }

    // Only validate on state-changing methods
    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const cookieToken = existingToken;
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'CSRF_VALIDATION_FAILED',
          message: 'CSRF token validation failed',
          statusCode: 403,
        },
      });
    }

    next();
  }
}
