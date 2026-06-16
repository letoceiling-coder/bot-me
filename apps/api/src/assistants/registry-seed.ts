/** Seed data for ToolDefinition and PromptPreset — synced on migrate/seed */

export const TOOL_DEFINITIONS = [
  {
    id: "create_lead",
    name: "Создать лид",
    description:
      "Создаёт лид в CRM, когда клиент выражает намерение купить или оставляет контакты.",
    category: "crm",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Имя клиента" },
        phone: { type: "string", description: "Телефон" },
        note: { type: "string", description: "Комментарий" },
      },
    },
    settingsSchema: {
      default_pipeline_stage: { type: "string", default: "new" },
      auto_assign: { type: "boolean", default: false },
    },
    sortOrder: 1,
  },
  {
    id: "create_client",
    name: "Создать клиента",
    description: "Добавляет клиента в базу при повторных обращениях.",
    category: "crm",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
      },
    },
    settingsSchema: {},
    sortOrder: 2,
  },
  {
    id: "schedule_meeting",
    name: "Записать на встречу",
    description: "Предлагает слоты и фиксирует запись на консультацию или демо.",
    category: "calendar",
    parameters: {
      type: "object",
      properties: {
        datetime: { type: "string" },
        topic: { type: "string" },
      },
    },
    settingsSchema: {
      slot_duration_minutes: { type: "number", default: 30 },
    },
    sortOrder: 3,
  },
  {
    id: "send_notification",
    name: "Уведомить оператора",
    description: "Отправляет уведомление владельцу или оператору о важном событии.",
    category: "notify",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
      },
    },
    settingsSchema: {},
    sortOrder: 4,
  },
  {
    id: "call_webhook",
    name: "Вызвать webhook",
    description: "Отправляет данные во внешнюю систему по URL.",
    category: "integration",
    parameters: {
      type: "object",
      properties: {
        event: { type: "string" },
        payload: { type: "object" },
      },
    },
    settingsSchema: {
      webhook_url: { type: "string" },
    },
    sortOrder: 5,
  },
  {
    id: "search_kb",
    name: "Поиск в базе знаний",
    description: "Ищет ответы в загруженных документах и FAQ компании.",
    category: "knowledge",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Поисковый запрос" },
      },
    },
    settingsSchema: {
      max_results: { type: "number", default: 5 },
    },
    sortOrder: 6,
  },
  {
    id: "handoff_human",
    name: "Передать оператору",
    description: "Передаёт диалог живому оператору, когда бот не может помочь.",
    category: "handoff",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string" },
      },
    },
    settingsSchema: {},
    sortOrder: 7,
  },
] as const;

export const PROMPT_PRESETS = [
  {
    id: "sales",
    name: "Менеджер по продажам",
    description: "Квалификация, прайс, запись, создание лидов.",
    defaultToolIds: [
      "create_lead",
      "create_client",
      "schedule_meeting",
      "search_kb",
      "handoff_human",
    ],
    systemPrompt: `Ты — AI-ассистент компании «{business_name}». Роль: менеджер по продажам.

Тон: дружелюбный, уверенный, без давления. Отвечай кратко, по делу, на русском языке.

Твои задачи:
- Уточнять потребность клиента
- Отвечать по прайсу и условиям (используй базу знаний)
- Предлагать следующий шаг: запись, заявка, звонок
- Создавать лид, когда клиент готов

Запрещено:
- Обещать скидки без явных правил
- Давать юридические гарантии
- Выдумывать цены и сроки

Доступные инструменты:
{enabled_tools_list}`,
    sortOrder: 1,
  },
  {
    id: "support",
    name: "Поддержка",
    description: "FAQ, статус заказа, эскалация сложных вопросов.",
    defaultToolIds: ["search_kb", "send_notification", "handoff_human", "create_client"],
    systemPrompt: `Ты — AI-ассистент поддержки компании «{business_name}».

Тон: спокойный, эмпатичный, профессиональный. Отвечай на русском языке.

Твои задачи:
- Отвечать на частые вопросы по FAQ и документам
- Уточнять детали проблемы
- Эскалировать оператору, если нет ответа в базе знаний

Запрещено:
- Оформлять возвраты без политики компании
- Обещать компенсации

Доступные инструменты:
{enabled_tools_list}`,
    sortOrder: 2,
  },
  {
    id: "avito",
    name: "Avito-специалист",
    description: "Ответы по объявлениям, уточнение товара, торг в рамках правил.",
    defaultToolIds: [
      "create_lead",
      "search_kb",
      "schedule_meeting",
      "handoff_human",
    ],
    systemPrompt: `Ты — AI-ассистент продавца на Avito для «{business_name}».

Тон: живой, как в мессенджере, без канцелярита. Русский язык.

Твои задачи:
- Отвечать на вопросы по объявлению
- Уточнять наличие, доставку, комплектацию
- Мягко вести к сделке и сбору контакта

Запрещено:
- Уводить клиента off-platform без согласия
- Согласовывать скидки вне правил

Доступные инструменты:
{enabled_tools_list}`,
    sortOrder: 3,
  },
  {
    id: "admin_coach",
    name: "Coach для владельца",
    description: "Анализ переписок и предложения по улучшению промптов.",
    defaultToolIds: ["search_kb", "send_notification"],
    systemPrompt: `Ты — Coach-ассистент для владельца «{business_name}».

Тон: экспертный, конструктивный. Русский язык.

Твои задачи:
- Анализировать качество ответов ассистентов
- Предлагать улучшения промптов и сценариев
- Указывать на риски и упущенные лиды

Запрещено:
- Менять настройки без явного подтверждения владельца

Доступные инструменты:
{enabled_tools_list}`,
    sortOrder: 4,
  },
] as const;
