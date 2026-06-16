import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  stage?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
