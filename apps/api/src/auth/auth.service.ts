import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import type { RegisterInput, LoginInput, AuthUser } from "@botme/shared";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "org";
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isPlatformAdmin: boolean;
    organizationId: string;
    organization: { id: string; name: string; slug: string; plan: string };
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AuthUser["role"],
      isPlatformAdmin: user.isPlatformAdmin,
      organizationId: user.organizationId,
      organization: user.organization,
    };
  }

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException("Email уже зарегистрирован");
    }

    let slug = slugify(input.organizationName);
    const slugTaken = await this.prisma.organization.findUnique({ where: { slug } });
    if (slugTaken) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name ?? null,
        role: "OWNER",
        organization: {
          create: {
            name: input.organizationName,
            slug,
            plan: "start",
          },
        },
      },
      include: { organization: true },
    });

    const token = this.signToken(user.id, user.organizationId);
    return { token, user: this.toAuthUser(user) };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { organization: true },
    });
    if (!user) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const token = this.signToken(user.id, user.organizationId);
    return { token, user: this.toAuthUser(user) };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { organization: true },
    });
    return this.toAuthUser(user);
  }

  private signToken(userId: string, organizationId: string): string {
    return this.jwt.sign({ sub: userId, organizationId });
  }
}
