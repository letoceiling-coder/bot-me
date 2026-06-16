export interface CoachSuggestionDto {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
}

export interface CoachSessionResponseDto {
  summary: string;
  suggestions: CoachSuggestionDto[];
  model: string;
}

export interface AuditLogDto {
  id: string;
  userId: string;
  action: string;
  resource: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
