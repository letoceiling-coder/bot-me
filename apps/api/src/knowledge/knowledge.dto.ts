import {
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateKnowledgeBaseDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PasteTextDocumentDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;
}
