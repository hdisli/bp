import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as winston from 'winston';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, message }) => {
              return `[${timestamp}] [ExceptionFilter] ${message}`;
            }),
          ),
        }),
      ],
    });
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    // If the exception already uses the unified format { success, error }, pass it through
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'success' in (exceptionResponse as Record<string, unknown>) &&
      (exceptionResponse as Record<string, unknown>).success === false
    ) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${JSON.stringify((exceptionResponse as Record<string, unknown>).error)}`,
      );
      response.status(status).json(exceptionResponse);
      return;
    }

    // Normalize to unified format
    let errorMessage = 'Internal server error';
    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as Record<string, unknown>;
      if (typeof resp.message === 'string') {
        errorMessage = resp.message;
      } else if (Array.isArray(resp.message)) {
        errorMessage = resp.message.join(', ');
      }
    }

    const errorResponse = {
      success: false as const,
      error: {
        code: this.getErrorCode(status),
        message: errorMessage,
        statusCode: status,
      },
    };

    this.logger.error(`${request.method} ${request.url} - ${status} - ${errorMessage}`);

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return codes[status] || 'UNKNOWN_ERROR';
  }
}
