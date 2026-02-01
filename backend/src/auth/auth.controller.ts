import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Ip,
  Param,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ApiResponseDto,
  AuthResponseDto,
  RefreshResponseDto,
  AuthUserDto,
} from './dto/auth-response.dto';
import { AuditLogService, AuditAction } from '../common/services/audit-log.service';

@Controller('api/auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('register')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    const result = await this.authService.register(registerDto);

    this.auditLogService.log({
      userId: result.id,
      action: AuditAction.REGISTER,
      ip,
      details: `User registered: ${result.email}`,
    });

    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1',
      },
    };
  }

  @Post('login')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    try {
      const result = await this.authService.login(loginDto);

      this.auditLogService.log({
        userId: result.id,
        action: AuditAction.LOGIN_SUCCESS,
        ip,
        details: `User logged in: ${result.email}`,
      });

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      this.auditLogService.log({
        userId: null,
        action: AuditAction.LOGIN_FAILED,
        ip,
        details: `Failed login attempt for: ${loginDto.emailOrUsername}`,
      });
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshDto: RefreshDto,
    @Ip() ip: string,
  ): Promise<ApiResponseDto<RefreshResponseDto>> {
    const result = await this.authService.refresh(refreshDto.refreshToken);

    this.auditLogService.log({
      userId: null,
      action: AuditAction.TOKEN_REFRESH,
      ip,
    });

    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1',
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: { refreshToken: string },
    @Ip() ip: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.authService.logout(body.refreshToken);

    this.auditLogService.log({
      userId: null,
      action: AuditAction.LOGOUT,
      ip,
    });

    return {
      success: true,
      data: { message: 'Logged out successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1',
      },
    };
  }

  @Get('verify/:token')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Param('token') token: string,
    @Ip() ip: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authService.verifyEmail(token);

    this.auditLogService.log({
      userId: null,
      action: AuditAction.REGISTER,
      ip,
      details: 'Email verified',
    });

    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1',
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(
    @Request() req: { user: AuthUserDto },
  ): Promise<ApiResponseDto<AuthUserDto>> {
    return {
      success: true,
      data: req.user,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1',
      },
    };
  }
}
