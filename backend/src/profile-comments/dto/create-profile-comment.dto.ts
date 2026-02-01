import { IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProfileCommentDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'Der Kommentar darf nicht leer sein.' })
  @MaxLength(500, { message: 'Der Kommentar darf maximal 500 Zeichen lang sein.' })
  comment: string;
}
