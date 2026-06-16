import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { buildSystemPrompt } from "@botme/shared";
import type {
  AssistantDto,
  AssistantToolConfigDto,
  CreateAssistantInput,
  PromptPresetDto,
  TestChatInput,
  TestChatResponse,
  ToolDefinitionDto,
  UpdateAssistantInput,
} from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AdminModule } from "../admin/admin.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { AgentModule } from "../agent/agent.module";
import { AgentRuntimeService } from "../agent/agent-runtime.service";
import { PROMPT_PRESETS, TOOL_DEFINITIONS } from "./registry-seed";

@Injectable()
export class AssistantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: AgentRuntimeService,
  ) {}

  async syncRegistry() {
    for (const tool of TOOL_DEFINITIONS) {
      await this.prisma.toolDefinition.upsert({
        where: { id: tool.id },
        create: {
          id: tool.id,
          name: tool.name,
          description: tool.description,
          category: tool.category,
          parameters: tool.parameters,
          settingsSchema: tool.settingsSchema,
          sortOrder: tool.sortOrder,
        },
        update: {
          name: tool.name,
          description: tool.description,
          category: tool.category,
          parameters: tool.parameters,
          settingsSchema: tool.settingsSchema,
          sortOrder: tool.sortOrder,
        },
      });
    }

    for (const preset of PROMPT_PRESETS) {
      await this.prisma.promptPreset.upsert({
        where: { id: preset.id },
        create: {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          systemPrompt: preset.systemPrompt,
          defaultToolIds: preset.defaultToolIds,
          sortOrder: preset.sortOrder,
        },
        update: {
          name: preset.name,
          description: preset.description,
          systemPrompt: preset.systemPrompt,
          defaultToolIds: preset.defaultToolIds,
          sortOrder: preset.sortOrder,
        },
      });
    }
  }

  listTools(): Promise<ToolDefinitionDto[]> {
    return this.prisma.toolDefinition.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async listPresets(): Promise<PromptPresetDto[]> {
    const rows = await this.prisma.promptPreset.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      systemPrompt: p.systemPrompt,
      defaultToolIds: p.defaultToolIds as string[],
      sortOrder: p.sortOrder,
    }));
  }

  async list(organizationId: string): Promise<AssistantDto[]> {
    const rows = await this.prisma.assistant.findMany({
      where: { organizationId },
      include: {
        toolConfigs: { include: { tool: true } },
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(rows.map((r) => this.toDto(r)));
  }

  async get(organizationId: string, id: string): Promise<AssistantDto> {
    const row = await this.findOwned(organizationId, id);
    return this.toDto(row);
  }

  async create(
    organizationId: string,
    input: CreateAssistantInput,
  ): Promise<AssistantDto> {
    await this.assertAssistantLimit(organizationId);

    const preset = await this.prisma.promptPreset.findFirst({
      where: { id: input.presetId, isActive: true },
    });
    if (!preset) {
      throw new NotFoundException("Пресет не найден");
    }

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    const defaultToolIds = preset.defaultToolIds as string[];
    const enabledToolIds = input.enabledToolIds ?? defaultToolIds;

    const tools = await this.prisma.toolDefinition.findMany({
      where: { id: { in: enabledToolIds }, isActive: true },
    });

    const builtPrompt = buildSystemPrompt({
      template: preset.systemPrompt,
      businessName: org.name,
      tools: tools.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
      })),
      customInstructions: input.customInstructions,
    });

    if (input.knowledgeBaseId) {
      await this.assertKnowledgeBase(organizationId, input.knowledgeBaseId);
    }

    const assistant = await this.prisma.assistant.create({
      data: {
        organizationId,
        name: input.name,
        presetId: preset.id,
        systemPrompt: builtPrompt,
        customInstructions: input.customInstructions ?? null,
        knowledgeBaseId: input.knowledgeBaseId ?? null,
        modelConfig: {
          model: input.model ?? "openai/gpt-4o-mini",
          temperature: input.temperature ?? 0.7,
        },
        toolConfigs: {
          create: enabledToolIds.map((toolId) => ({
            toolId,
            enabled: true,
            settings: {},
          })),
        },
      },
      include: {
        toolConfigs: { include: { tool: true } },
        organization: true,
      },
    });

    return this.toDto(assistant);
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateAssistantInput,
  ): Promise<AssistantDto> {
    const existing = await this.findOwned(organizationId, id);

    if (input.enabledToolIds) {
      await this.prisma.assistantToolConfig.deleteMany({
        where: { assistantId: id },
      });
      await this.prisma.assistantToolConfig.createMany({
        data: input.enabledToolIds.map((toolId) => ({
          assistantId: id,
          toolId,
          enabled: true,
          settings: {},
        })),
      });
    }

    const preset = existing.presetId
      ? await this.prisma.promptPreset.findUnique({
          where: { id: existing.presetId },
        })
      : null;

    if (!preset) {
      throw new BadRequestException("Пресет ассистента не найден");
    }

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    const refreshed = await this.prisma.assistant.findUniqueOrThrow({
      where: { id },
      include: {
        toolConfigs: { include: { tool: true } },
        organization: true,
      },
    });

    const customInstructions =
      input.customInstructions !== undefined
        ? input.customInstructions
        : refreshed.customInstructions;

    const enabledTools = refreshed.toolConfigs
      .filter((c) => c.enabled)
      .map((c) => c.tool);

    const template = preset.systemPrompt;
    const builtPrompt = buildSystemPrompt({
      template,
      businessName: org.name,
      tools: enabledTools.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
      })),
      customInstructions,
    });

    const modelConfig = {
      ...(typeof refreshed.modelConfig === "object" && refreshed.modelConfig
        ? (refreshed.modelConfig as Record<string, unknown>)
        : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
    };

    if (input.knowledgeBaseId !== undefined) {
      if (input.knowledgeBaseId) {
        await this.assertKnowledgeBase(organizationId, input.knowledgeBaseId);
      }
    }

    const updated = await this.prisma.assistant.update({
      where: { id },
      data: {
        name: input.name ?? refreshed.name,
        customInstructions: customInstructions ?? null,
        systemPrompt: builtPrompt,
        modelConfig,
        isActive: input.isActive ?? refreshed.isActive,
        ...(input.knowledgeBaseId !== undefined
          ? { knowledgeBaseId: input.knowledgeBaseId }
          : {}),
      },
      include: {
        toolConfigs: { include: { tool: true } },
        organization: true,
      },
    });

    return this.toDto(updated);
  }

  async remove(organizationId: string, id: string) {
    await this.findOwned(organizationId, id);
    await this.prisma.assistant.delete({ where: { id } });
    return { ok: true };
  }

  async previewPrompt(organizationId: string, id: string) {
    const dto = await this.get(organizationId, id);
    return { builtPrompt: dto.builtPrompt ?? dto.systemPrompt };
  }

  async testChat(
    organizationId: string,
    id: string,
    input: TestChatInput,
  ): Promise<TestChatResponse> {
    return this.agent.generateReply({
      organizationId,
      assistantId: id,
      userMessage: input.message,
      history: input.history,
    });
  }

  private async assertKnowledgeBase(organizationId: string, baseId: string) {
    const base = await this.prisma.knowledgeBase.findFirst({
      where: { id: baseId, organizationId },
    });
    if (!base) {
      throw new BadRequestException("База знаний не найдена");
    }
  }

  private async findOwned(organizationId: string, id: string) {
    const row = await this.prisma.assistant.findFirst({
      where: { id, organizationId },
      include: {
        toolConfigs: { include: { tool: true } },
        organization: true,
      },
    });
    if (!row) throw new NotFoundException("Ассистент не найден");
    return row;
  }

  private async assertAssistantLimit(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const tariff = await this.prisma.tariffPlan.findUnique({
      where: { slug: org.plan },
    });
    const limits = (tariff?.limits ?? {}) as { assistants?: number };
    const max = limits.assistants ?? 1;
    const count = await this.prisma.assistant.count({
      where: { organizationId, isActive: true },
    });
    if (count >= max) {
      throw new BadRequestException(
        `Лимит тарифа: максимум ${max} активных ассистентов`,
      );
    }
  }

  private toDto(
    row: Awaited<ReturnType<typeof this.findOwned>>,
  ): AssistantDto {
    const tools: AssistantToolConfigDto[] = row.toolConfigs.map((c) => ({
      toolId: c.toolId,
      enabled: c.enabled,
      settings: (c.settings ?? {}) as Record<string, unknown>,
      tool: {
        id: c.tool.id,
        name: c.tool.name,
        description: c.tool.description,
        category: c.tool.category,
        parameters: c.tool.parameters,
        settingsSchema: c.tool.settingsSchema,
        isActive: c.tool.isActive,
        sortOrder: c.tool.sortOrder,
      },
    }));

    const modelConfig = row.modelConfig as {
      model?: string;
      temperature?: number;
    } | null;

    return {
      id: row.id,
      name: row.name,
      presetId: row.presetId,
      systemPrompt: row.systemPrompt,
      customInstructions: row.customInstructions,
      modelConfig,
      isActive: row.isActive,
      knowledgeBaseId: row.knowledgeBaseId,
      builtPrompt: row.systemPrompt,
      tools,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
