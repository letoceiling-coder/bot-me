import { IsString, MinLength } from "class-validator";

export class InboxReplyDto {
  @IsString()
  @MinLength(1)
  content!: string;
}
