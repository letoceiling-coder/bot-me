import { Injectable, NotFoundException } from "@nestjs/common";
import type { LeadDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { detectLeadIntent } from "./lead-intent.util";
import type { CreateLeadDto, UpdateLeadDto } from "./leads.dto";

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(organizationId: string): Promise<LeadDto[]> {
    const rows = await this.prisma.lead.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((r) => this.toDto(r));
  }

  async create(organizationId: string, body: CreateLeadDto): Promise<LeadDto> {
    const row = await this.prisma.lead.create({
      data: {
        organizationId,
        name: body.name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        source: body.source ?? "manual",
        note: body.note ?? null,
        stage: "new",
      },
    });
    await this.notifications.notifyOrg({
      organizationId,
      type: "new_lead",
      title: "Новый лид",
      body: [row.name, row.phone].filter(Boolean).join(" · ") || "Добавлен вручную",
    });
    return this.toDto(row);
  }

  async update(
    organizationId: string,
    id: string,
    body: UpdateLeadDto,
  ): Promise<LeadDto> {
    const existing = await this.prisma.lead.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException("Лид не найден");

    const row = await this.prisma.lead.update({
      where: { id },
      data: {
        stage: body.stage,
        name: body.name,
        phone: body.phone,
        note: body.note,
      },
    });
    return this.toDto(row);
  }

  async maybeCreateFromMessage(params: {
    organizationId: string;
    assistantId: string;
    text: string;
    source: string;
    conversationId: string;
    peerName?: string | null;
  }) {
    const hasTool = await this.prisma.assistantToolConfig.findFirst({
      where: {
        assistantId: params.assistantId,
        toolId: "create_lead",
        enabled: true,
      },
    });
    if (!hasTool) return null;

    const intent = detectLeadIntent(params.text);
    if (!intent.hasIntent) return null;

    const existing = await this.prisma.lead.findFirst({
      where: {
        organizationId: params.organizationId,
        conversationId: params.conversationId,
      },
    });
    if (existing) return existing;

    const lead = await this.prisma.lead.create({
      data: {
        organizationId: params.organizationId,
        conversationId: params.conversationId,
        name: params.peerName ?? null,
        phone: intent.phone,
        source: params.source,
        note: intent.note,
        stage: "new",
      },
    });

    await this.notifications.notifyOrg({
      organizationId: params.organizationId,
      type: "new_lead",
      title: "Новый лид из диалога",
      body: [lead.name, lead.phone, params.source].filter(Boolean).join(" · "),
    });

    return lead;
  }

  private toDto(row: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    source: string | null;
    stage: string;
    note: string | null;
    conversationId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): LeadDto {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      source: row.source,
      stage: row.stage,
      note: row.note,
      conversationId: row.conversationId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
