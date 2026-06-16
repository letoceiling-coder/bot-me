import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";

export const ORG_ROLES_KEY = "orgRoles";
export const OrgRoles = (...roles: string[]) => SetMetadata(ORG_ROLES_KEY, roles);

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed =
      this.reflector.get<string[]>(ORG_ROLES_KEY, context.getHandler()) ??
      this.reflector.get<string[]>(ORG_ROLES_KEY, context.getClass()) ??
      ["OWNER", "ADMIN"];

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId as string | undefined;
    if (!userId) {
      throw new ForbiddenException("Требуется авторизация");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || !allowed.includes(user.role)) {
      throw new ForbiddenException("Недостаточно прав");
    }
    return true;
  }
}
