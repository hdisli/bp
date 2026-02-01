import { IsOptional, IsString, IsInt, IsEnum, MaxLength, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Bio must be at most 300 characters' })
  bio?: string;

  @IsOptional()
  @IsInt({ message: 'Age must be a whole number' })
  @Min(13, { message: 'Age must be at least 13' })
  @Max(120, { message: 'Age must be at most 120' })
  age?: number;

  @IsOptional()
  @IsEnum(['male', 'female', 'diverse'], {
    message: 'Gender must be male, female, or diverse',
  })
  gender?: 'male' | 'female' | 'diverse';

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'State must be at most 100 characters' })
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Signature must be at most 150 characters' })
  signature?: string;

  @IsOptional()
  @IsEnum(['public', 'friends_only', 'private'], {
    message: 'Profile visibility must be public, friends_only, or private',
  })
  profileVisibility?: 'public' | 'friends_only' | 'private';

  @IsOptional()
  @IsEnum(['everyone', 'friends_of_friends', 'none'], {
    message: 'Allow friend requests from must be everyone, friends_of_friends, or none',
  })
  allowFriendRequestsFrom?: 'everyone' | 'friends_of_friends' | 'none';
}
