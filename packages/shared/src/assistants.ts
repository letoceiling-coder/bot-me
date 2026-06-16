export interface ToolDefinitionDto {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: unknown;
  settingsSchema: unknown;
  isActive: boolean;
  sortOrder: number;
}

export interface PromptPresetDto {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  defaultToolIds: string[];
  sortOrder: number;
}

export interface AssistantToolConfigDto {
  toolId: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  tool?: ToolDefinitionDto;
}

export interface AssistantDto {
  id: string;
  name: string;
  presetId: string | null;
  systemPrompt: string;
  customInstructions: string | null;
  modelConfig: { model?: string; temperature?: number } | null;
  isActive: boolean;
  builtPrompt?: string;
  tools: AssistantToolConfigDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssistantInput {
  name: string;
  presetId: string;
  customInstructions?: string;
  model?: string;
  temperature?: number;
  enabledToolIds?: string[];
}

export interface UpdateAssistantInput {
  name?: string;
  customInstructions?: string;
  model?: string;
  temperature?: number;
  isActive?: boolean;
  enabledToolIds?: string[];
}
