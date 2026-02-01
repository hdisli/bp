import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../../users/users.service';

@Injectable()
export class OnlineStatusService {
  private readonly logger = new Logger(OnlineStatusService.name);

  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleOfflineCheck(): Promise<void> {
    try {
      await this.usersService.markOfflineInactive();
      this.logger.debug('Offline check completed');
    } catch (error) {
      this.logger.error('Failed to run offline check', (error as Error).stack);
    }
  }
}
