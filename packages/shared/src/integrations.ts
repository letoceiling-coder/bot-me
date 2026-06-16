export interface VkIntegrationDto {
  status: string;
  enabled: boolean;
  lastError: string | null;
  assistantId: string | null;
  groupId: number | null;
  groupName: string | null;
  hasCredentials: boolean;
  tokenMasked: string | null;
  webhookUrl: string | null;
}

export interface MaxIntegrationDto {
  status: string;
  enabled: boolean;
  lastError: string | null;
  assistantId: string | null;
  botName: string | null;
  hasToken: boolean;
  tokenMasked: string | null;
}
