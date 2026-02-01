import { IsEnum } from 'class-validator';
import { ReactionType } from '../entities/profile-comment-reaction.entity';

export class ReactToCommentDto {
  @IsEnum(ReactionType, { message: 'Ungültiger Reaktionstyp.' })
  type: ReactionType;
}
