import { IsString, MinLength } from "class-validator";

export class CoachAnalyzeDto {
  @IsString()
  @MinLength(1)
  conversationId!: string;
}
