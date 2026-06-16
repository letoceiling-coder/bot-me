export interface IntegrationStatusDto {
  type: string;
  enabled: boolean;
  status: string;
  lastError: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TelegramIntegrationDto {
  status: string;
  enabled: boolean;
  lastError: string | null;
  botUsername: string | null;
  assistantId: string | null;
  hasToken: boolean;
  tokenMasked: string | null;
}

export interface InboxConversationDto {
  id: string;
  channel: string;
  peerName: string | null;
  status: string;
  lastMessageAt: string;
  preview: string | null;
  messageCount: number;
}

export interface InboxMessageDto {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}
