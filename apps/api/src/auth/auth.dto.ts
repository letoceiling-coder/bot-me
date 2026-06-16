import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Некорректный email" })
  email!: string;

  @IsString()
  @MinLength(8, { message: "Минимум 8 символов" })
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString({ message: "Укажите название организации" })
  organizationName!: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Некорректный email" })
  email!: string;

  @IsString()
  password!: string;
}
