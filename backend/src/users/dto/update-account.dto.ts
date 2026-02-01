import { IsOptional, IsEmail, IsString, MinLength, Matches, ValidateIf } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ValidateIf((o: UpdateAccountDto) => !!o.email || !!o.newPassword)
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword?: string;
}
