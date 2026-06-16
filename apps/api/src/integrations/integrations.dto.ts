import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateTelegramIntegrationDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  botToken?: string;

  @IsString()
  assistantId!: string;
}
