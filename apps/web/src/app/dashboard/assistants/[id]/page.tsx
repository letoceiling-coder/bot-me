"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { AssistantDto, ToolDefinitionDto } from "@botme/shared";

export default function EditAssistantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [assistant, setAssistant] = useState<AssistantDto | null>(null);
  const [tools, setTools] = useState<ToolDefinitionDto[]>([]);
  const [name, setName] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [enabledToolIds, setEnabledToolIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [promptPreview, setPromptPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<AssistantDto>(`/assistants/${id}`),
      apiFetch<ToolDefinitionDto[]>("/tools"),
    ])
      .then(([a, t]) => {
        setAssistant(a);
        setName(a.name);
        setCustomInstructions(a.customInstructions ?? "");
        setEnabledToolIds(a.tools.filter((x) => x.enabled).map((x) => x.toolId));
        setIsActive(a.isActive);
        setPromptPreview(a.builtPrompt ?? a.systemPrompt);
        setTools(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [id]);

  function toggleTool(toolId: string) {
    setEnabledToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((x) => x !== toolId) : [...prev, toolId],
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const updated = await apiFetch<AssistantDto>(`/assistants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          customInstructions,
          enabledToolIds,
          isActive,
        }),
      });
      setAssistant(updated);
      setPromptPreview(updated.builtPrompt ?? updated.systemPrompt);
      setMsg("Сохранено");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function refreshPreview() {
    const { builtPrompt } = await apiFetch<{ builtPrompt: string }>(
      `/assistants/${id}/prompt-preview`,
    );
    setPromptPreview(builtPrompt);
  }

  if (loading) return <p className="text-text-muted">Загрузка…</p>;
  if (!assistant) {
    return <p className="text-red-400">{error || "Не найден"}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/assistants" className="text-sm text-accent hover:underline">
          ← К списку
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
          {assistant.name}
        </h1>
        <p className="mt-1 text-sm text-text-muted">Пресет: {assistant.presetId}</p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
      {msg && (
        <p className="rounded-[10px] bg-accent/10 px-3 py-2 text-sm text-accent">{msg}</p>
      )}

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-[14px] border border-white/6 bg-surface p-6 space-y-4">
          <label className="block text-sm text-text-muted">Название</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 outline-none focus:border-accent"
            required
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Ассистент активен
          </label>

          <label className="block text-sm text-text-muted">Дополнительные инструкции</label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 outline-none focus:border-accent"
          />
        </section>

        <section className="rounded-[14px] border border-white/6 bg-surface p-6 space-y-3">
          <h2 className="font-semibold">Инструменты</h2>
          <div className="space-y-2">
            {tools.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-white/6 p-3"
              >
                <input
                  type="checkbox"
                  checked={enabledToolIds.includes(t.id)}
                  onChange={() => toggleTool(t.id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-sm">{t.name}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">{t.description}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[14px] border border-accent/20 bg-accent/5 p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">System prompt</h2>
            <button
              type="button"
              onClick={refreshPreview}
              className="text-xs text-accent hover:underline"
            >
              Обновить
            </button>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs text-text-secondary">
            {promptPreview}
          </pre>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-[10px] bg-accent py-3 font-medium text-[#042f2e] disabled:opacity-50"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/assistants")}
            className="rounded-[10px] border border-white/10 px-6 py-3 text-sm"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
