export interface KnowledgeBaseDto {
  id: string;
  name: string;
  description: string | null;
  documentCount: number;
  createdAt: string;
}

export interface KnowledgeDocumentDto {
  id: string;
  knowledgeBaseId: string;
  title: string;
  sourceType: string;
  status: string;
  chunkCount: number;
  fileName: string | null;
  fileSize: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface TestChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TestChatInput {
  message: string;
  history?: TestChatMessage[];
}

export interface TestChatResponse {
  reply: string;
  sources: Array<{ documentTitle: string; excerpt: string }>;
  model: string;
}
