import { Injectable, Logger } from '@nestjs/common';

export enum AuditAction {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTER = 'REGISTER',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  LOGOUT = 'LOGOUT',
  RATING_CREATED = 'RATING_CREATED',
  RATING_DELETED = 'RATING_DELETED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  AVATAR_UPLOADED = 'AVATAR_UPLOADED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  FRIEND_REQUEST_SENT = 'FRIEND_REQUEST_SENT',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',
  USER_BLOCKED = 'USER_BLOCKED',
  USER_UNBLOCKED = 'USER_UNBLOCKED',
}

interface AuditLogEntry {
  timestamp: string;
  userId: number | null;
  action: AuditAction;
  ip: string;
  details?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger('AuditLog');

  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logger.log(JSON.stringify(logEntry));
  }
}
