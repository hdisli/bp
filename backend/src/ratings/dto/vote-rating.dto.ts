import { IsIn, IsString } from 'class-validator';

export class VoteRatingDto {
  @IsString()
  @IsIn(['like', 'dislike'], { message: 'Type must be either "like" or "dislike"' })
  type: 'like' | 'dislike';
}
