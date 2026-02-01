import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../../users/users.service';

interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; username: string };
}

@Injectable()
export class LastSeenMiddleware implements NestMiddleware {
  private lastUpdated = new Map<number, number>();

  constructor(private readonly usersService: UsersService) {}

  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    const userId = req.user?.id;

    if (userId) {
      const now = Date.now();
      const lastUpdate = this.lastUpdated.get(userId) || 0;

      // Only update if last update was more than 1 minute ago
      if (now - lastUpdate > 60_000) {
        this.lastUpdated.set(userId, now);
        this.usersService.setOnlineStatus(userId, true).catch(() => {
          // Fire-and-forget, don't block request
        });
      }
    }

    next();
  }
}
