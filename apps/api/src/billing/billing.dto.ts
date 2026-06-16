import { IsString, MinLength } from "class-validator";

export class CheckoutDto {
  @IsString()
  @MinLength(2)
  tariffSlug!: string;
}
