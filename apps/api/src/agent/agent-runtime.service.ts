import { BadRequestException, Injectable } from "@nestjs/common";
import type { TestChatMessage, TestChatResponse } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsAdminService } from "../admin/settings-admin.service";
import { KnowledgeService } from "../knowledge/knowledge.service";

@Injectable()
export class AgentRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsAdminService,
    private readonly knowledge: KnowledgeService,
  ) {}

  async generateReply(params: {
    organizationId: string;
    assistantId: string;
    userMessage: string;
    history?: TestChatMessage[];
  }): Promise<TestChatResponse> {
    const assistant = await this.prisma.assistant.findFirst({
      where: { id: params.assistantId, organizationId: params.organizationId },
    });
    if (!assistant) {
      throw new BadRequestException("Ассистент не найден");
    }

    const apiKey = await this.settings.getOpenRouterApiKey();
    if (!apiKey) {
      throw new BadRequestException(
        "OpenRouter не настроен. Администратор должен добавить API-ключ.",
      );
    }

    const model =
      (assistant.modelConfig as { model?: string } | null)?.model ??
      (await this.settings.getOpenRouterDefaultModel());

    const sources = assistant.knowledgeBaseId
      ? await this.knowledge.search(
          params.organizationId,
          assistant.knowledgeBaseId,
          params.userMessage,
          4,
        )
      : [];

    const kbBlock =
      sources.length > 0
        ? `\n\nКонтекст из базы знаний:\n${sources
            .map(
              (s, i) =>
                `[${i + 1}] ${s.documentTitle}: ${s.content.slice(0, 600)}`,
            )
            .join("\n\n")}`
        : "";

    const systemContent = `${assistant.systemPrompt}${kbBlock}\n\nОтвечай только на основе контекста и инструкций. Если данных нет — честно скажи об этом. Будь кратким, на русском языке.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemContent },
      ...(params.history ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: params.userMessage },
    ];

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bot-me.neeklo.ru",
        "X-Title": "botme",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature:
          (assistant.modelConfig as { temperature?: number } | null)
            ?.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new BadRequestException(
        `OpenRouter: ${errText.slice(0, 300) || res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Не удалось получить ответ модели.";

    return {
      reply,
      sources: sources.map((s) => ({
        documentTitle: s.documentTitle,
        excerpt: s.excerpt,
      })),
      model,
    };
  }
}
