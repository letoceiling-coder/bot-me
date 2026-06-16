"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { AssistantDto, PromptPresetDto, ToolDefinitionDto } from "@botme/shared";
import { buildSystemPrompt } from "@botme/shared";

export default function NewAssistantPage() {
  const router = useRouter();
  const [presets, setPresets] = useState<PromptPresetDto[]>([]);
  const [tools, setTools] = useState<ToolDefinitionDto[]>([]);
  const [name, setName] = useState("");
  const [presetId, setPresetId] = useState("sales");
  const [customInstructions, setCustomInstructions] = useState("");
  const [enabledToolIds, setEnabledToolIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<PromptPresetDto[]>("/presets"),
      apiFetch<ToolDefinitionDto[]>("/tools"),
    ]).then(([p, t]) => {
      setPresets(p);
      setTools(t);
      const defaultPreset = p.find((x) => x.id === "sales") ?? p[0];
      if (defaultPreset) {
        setPresetId(defaultPreset.id);
        setEnabledToolIds(defaultPreset.defaultToolIds);
      }
    });
  }, []);

  useEffect(() => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) setEnabledToolIds(preset.defaultToolIds);
  }, [presetId, presets]);

  const preview = useMemo(() => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return "";
    const enabled = tools.filter((t) => enabledToolIds.includes(t.id));
    return buildSystemPrompt({
      template: preset.systemPrompt,
      businessName: "Ваша компания",
      tools: enabled.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
      })),
      customInstructions,
    });
  }, [presets, presetId, tools, enabledToolIds, customInstructions]);

  function toggleTool(id: string) {
    setEnabledToolIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const created = await apiFetch<AssistantDto>("/assistants", {
        method: "POST",
        body: JSON.stringify({
          name,
          presetId,
          customInstructions: customInstructions || undefined,
          enabledToolIds,
        }),
      });
      router.push(`/dashboard/assistants/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/assistants" className="text-sm text-accent hover:underline">
          ← К списку
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
          Новый ассистент
        </h1>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-[14px] border border-white/6 bg-surface p-6 space-y-4">
          <label className="block text-sm text-text-muted">Название</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Продажи Avito"
            className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 outline-none focus:border-accent"
            required
          />

          <label className="block text-sm text-text-muted">Пресет</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetId(p.id)}
                className={`rounded-[10px] border p-3 text-left text-sm ${
                  presetId === p.id
                    ? "border-accent/50 bg-accent/5"
                    : "border-white/6 hover:border-white/12"
                }`}
              >
                <span className="font-medium">{p.name}</span>
                {p.description && (
                  <span className="mt-1 block text-xs text-text-muted">{p.description}</span>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[14px] border border-white/6 bg-surface p-6 space-y-3">
          <h2 className="font-semibold">Инструменты</h2>
          <div className="space-y-2">
            {tools.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-white/6 p-3 hover:border-white/12"
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

        <section className="rounded-[14px] border border-white/6 bg-surface p-6 space-y-3">
          <label className="block text-sm text-text-muted">
            Дополнительные инструкции (необязательно)
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 outline-none focus:border-accent"
            placeholder="Особые правила для вашего бизнеса…"
          />
        </section>

        <section className="rounded-[14px] border border-accent/20 bg-accent/5 p-6">
          <h2 className="mb-2 font-semibold">Предпросмотр system prompt</h2>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-text-secondary">
            {preview || "Выберите пресет…"}
          </pre>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[10px] bg-accent py-3 font-medium text-[#042f2e] disabled:opacity-50"
        >
          {loading ? "Создание…" : "Создать ассистента"}
        </button>
      </form>
    </div>
  );
}
