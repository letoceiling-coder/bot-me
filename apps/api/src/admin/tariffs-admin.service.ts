import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";import { CreateTariffDto, UpdateTariffDto } from "./tariffs-admin.dto";

@Injectable()
export class TariffsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.tariffPlan.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async create(dto: CreateTariffDto) {
    const exists = await this.prisma.tariffPlan.findUnique({
      where: { slug: dto.slug },
    });
    if (exists) {
      throw new ConflictException("Тариф с таким slug уже существует");
    }
    return this.prisma.tariffPlan.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        currency: dto.currency ?? "RUB",
        features: (dto.features ?? []) as Prisma.InputJsonValue,
        limits: (dto.limits ?? {}) as Prisma.InputJsonValue,        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateTariffDto) {
    await this.ensureExists(id);
    if (dto.slug) {
      const clash = await this.prisma.tariffPlan.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (clash) throw new ConflictException("Slug уже занят");
    }
    return this.prisma.tariffPlan.update({
      where: { id },
      data: {
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        currency: dto.currency,
        features: dto.features as Prisma.InputJsonValue | undefined,
        limits: dto.limits as Prisma.InputJsonValue | undefined,        isActive: dto.isActive,
        isFeatured: dto.isFeatured,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.tariffPlan.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const row = await this.prisma.tariffPlan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Тариф не найден");
  }
}
