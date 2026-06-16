import { z } from "zod";

export const UserRole = z.enum(["OWNER", "ADMIN", "OPERATOR"]);
export type UserRole = z.infer<typeof UserRole>;

export const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
  name: z.string().min(1, "Укажите имя").optional(),
  organizationName: z.string().min(1, "Укажите название организации"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const IntegrationType = z.enum(["avito", "telegram", "vk", "max"]);
export type IntegrationType = z.infer<typeof IntegrationType>;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isPlatformAdmin: boolean;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

export interface TariffPlanDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  currency: string;
  features: unknown;
  limits: unknown;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}
