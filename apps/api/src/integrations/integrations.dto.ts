import { IsInt, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateTelegramIntegrationDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  botToken?: string;

  @IsString()
  assistantId!: string;
}

export class UpdateAvitoIntegrationDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  clientId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  clientSecret?: string;

  @IsOptional()
  @IsInt()
  profileId?: number;

  @IsString()
  assistantId!: string;
}
