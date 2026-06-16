export interface LeadDto {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  stage: string;
  note: string | null;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvitoIntegrationDto {
  status: string;
  enabled: boolean;
  lastError: string | null;
  assistantId: string | null;
  profileId: number | null;
  hasCredentials: boolean;
  clientIdMasked: string | null;
}
