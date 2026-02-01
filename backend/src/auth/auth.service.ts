import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { EmailVerification } from '../entities/email-verification.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';

interface JwtPayload {
  sub: number;
  email: string;
  username: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password } = dto;

    // Validate password strength (additional validation beyond DTO)
    this.validatePasswordStrength(password);

    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email already registered',
        statusCode: 409,
      });
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException({
        code: 'USERNAME_ALREADY_EXISTS',
        message: 'Username already taken',
        statusCode: 409,
      });
    }

    // Hash password with Argon2
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      username,
      passwordHash,
      isVerified: true,
    });

    try {
      await this.userRepository.save(user);
      this.logger.log(`User registered: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to register user: ${error.message}`);
      throw error;
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    const verification = this.emailVerificationRepository.create({
      userId: user.id,
      token: verificationToken,
      expiresAt: verificationExpiry,
    });
    await this.emailVerificationRepository.save(verification);

    this.logger.log(
      `Email verification link: /api/auth/verify/${verificationToken} (user: ${user.email})`,
    );

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const { emailOrUsername, password } = dto;

    // Find user by email or username
    const user = await this.userRepository.findOne({
      where: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email/username or password',
        statusCode: 401,
      });
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email/username or password',
        statusCode: 401,
      });
    }

    this.logger.log(`User logged in: ${user.email}`);

    // Set online status
    user.onlineStatus = true;
    user.lastSeen = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResponseDto> {
    // Hash the provided refresh token
    const tokenHash = this.hashToken(refreshToken);

    // Find the refresh token in database
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
        statusCode: 401,
      });
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await this.refreshTokenRepository.delete(storedToken.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
        statusCode: 401,
      });
    }

    // Invalidate old refresh token (rotation)
    await this.refreshTokenRepository.delete(storedToken.id);

    // Generate new token pair
    const tokens = await this.generateTokens(storedToken.user);

    this.logger.log(`Token rotated for user: ${storedToken.user.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: payload.sub },
    });
  }

  private validatePasswordStrength(password: string): void {
    const message =
      'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character';

    if (password.length < 8) {
      throw new BadRequestException({ code: 'INVALID_PASSWORD', message, statusCode: 400 });
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException({ code: 'INVALID_PASSWORD', message, statusCode: 400 });
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException({ code: 'INVALID_PASSWORD', message, statusCode: 400 });
    }

    if (!/\d/.test(password)) {
      throw new BadRequestException({ code: 'INVALID_PASSWORD', message, statusCode: 400 });
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw new BadRequestException({ code: 'INVALID_PASSWORD', message, statusCode: 400 });
    }
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
    });

    // Generate refresh token (random string)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(refreshToken);

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    // Store refresh token in database
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    // Find the token to get the user ID before deleting
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (storedToken) {
      await this.userRepository.update(storedToken.userId, {
        onlineStatus: false,
        lastSeen: new Date(),
      });
    }

    await this.refreshTokenRepository.delete({ tokenHash });
    this.logger.log('User logged out, refresh token deleted');
  }

  async logoutAll(userId: number): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
    this.logger.log(`All refresh tokens deleted for user ${userId}`);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verification = await this.emailVerificationRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!verification) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'Invalid or expired verification token',
        statusCode: 400,
      });
    }

    if (new Date() > verification.expiresAt) {
      await this.emailVerificationRepository.delete(verification.id);
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_EXPIRED',
        message: 'Verification token has expired',
        statusCode: 400,
      });
    }

    verification.user.isVerified = true;
    await this.userRepository.save(verification.user);
    await this.emailVerificationRepository.delete(verification.id);

    this.logger.log(`Email verified for user: ${verification.user.email}`);

    return { message: 'Email verified successfully' };
  }

  async isUserVerified(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.isVerified ?? false;
  }
}
