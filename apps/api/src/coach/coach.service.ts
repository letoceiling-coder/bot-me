import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { CoachSessionResponseDto, CoachSuggestionDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsAdminService } from "../admin/settings-admin.service";
import { UsageService } from "../billing/usage.service";

const COACH_MODEL = "anthropic/claude-3.5-sonnet";

@Injectable()
export class CoachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsAdminService,
    private readonly usage: UsageService,
  ) {}

  async analyzeConversation(
    organizationId: string,
    conversationId: string,
  ): Promise<CoachSessionResponseDto> {
    await this.usage.assertCanUseLlm(organizationId);
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 40 },
      },
    });
    if (!conv) throw new NotFoundException("Диалог не найден");

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    const preset = await this.prisma.promptPreset.findUnique({
      where: { id: "admin_coach" },
    });

    const transcript = conv.messages
      .map(
        (m) =>
          `[${m.role === "user" ? "Клиент" : m.role === "operator" ? "Оператор" : "Ассистент"}]: ${m.content}`,
      )
      .join("\n");

    const apiKey = await this.settings.getOpenRouterApiKey();
    if (!apiKey) {
      throw new BadRequestException(
        "OpenRouter не настроен. Администратор платформы должен добавить API-ключ.",
      );
    }

    const systemPrompt = (preset?.systemPrompt ?? "")
      .replace("{business_name}", org?.name ?? "бизнес")
      .replace("{enabled_tools_list}", "анализ переписки");

    const userPrompt = `Проанализируй переписку канала «${conv.channel}» с «${conv.peerName ?? "клиентом"}».

Транскрипт:
${transcript || "(сообщений нет)"}

Верни ТОЛЬКО валидный JSON без markdown:
{
  "summary": "краткий вывод на русском",
  "suggestions": [
    { "title": "заголовок", "detail": "что улучшить", "priority": "high|medium|low" }
  ]
}

Дай 3–5 конкретных предложений по улучшению промпта и сценария ассистента.`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bot-me.neeklo.ru",
        "X-Title": "botme-coach",
      },
      body: JSON.stringify({
        model: COACH_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
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
    const raw =
      data.choices?.[0]?.message?.content?.trim() ||
      '{"summary":"Не удалось получить анализ","suggestions":[]}';

    await this.usage.recordLlmCall(organizationId);
    return this.parseCoachResponse(raw, COACH_MODEL);
  }

  private parseCoachResponse(
    raw: string,
    model: string,
  ): CoachSessionResponseDto {
    const jsonText = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    try {
      const parsed = JSON.parse(jsonText) as {
        summary?: string;
        suggestions?: CoachSuggestionDto[];
      };
      return {
        summary: parsed.summary ?? "Анализ выполнен",
        suggestions: (parsed.suggestions ?? []).slice(0, 8).map((s) => ({
          title: s.title ?? "Рекомендация",
          detail: s.detail ?? "",
          priority: s.priority ?? "medium",
        })),
        model,
      };
    } catch {
      return {
        summary: raw.slice(0, 400),
        suggestions: [
          {
            title: "Ответ модели",
            detail: raw.slice(0, 600),
            priority: "medium",
          },
        ],
        model,
      };
    }
  }
}
