export interface PromptToolRef {
  id: string;
  name: string;
  description: string;
}

export function buildSystemPrompt(params: {
  template: string;
  businessName: string;
  tools: PromptToolRef[];
  customInstructions?: string | null;
}): string {
  const toolsList =
    params.tools.length > 0
      ? params.tools.map((t) => `- ${t.id}: ${t.name} — ${t.description}`).join("\n")
      : "— инструменты не подключены —";

  const custom = params.customInstructions?.trim()
    ? `\n\nДополнительные инструкции:\n${params.customInstructions.trim()}`
    : "";

  return params.template
    .replaceAll("{business_name}", params.businessName)
    .replaceAll("{enabled_tools_list}", toolsList)
    .concat(custom);
}
