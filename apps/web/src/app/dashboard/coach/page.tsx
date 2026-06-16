"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  CoachSessionResponseDto,
  InboxConversationDto,
} from "@botme/shared";

export default function CoachPage() {
  const [conversations, setConversations] = useState<InboxConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [result, setResult] = useState<CoachSessionResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<InboxConversationDto[]>("/inbox/conversations")
      .then((list) => {
        setConversations(list);
        if (list[0]) setSelectedId(list[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  async function analyze() {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await apiFetch<CoachSessionResponseDto>("/coach/sessions", {
          method: "POST",
          body: JSON.stringify({ conversationId: selectedId }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка анализа");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Coach-ассистент
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Анализ переписок и рекомендации по улучшению промптов
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <section className="rounded-[14px] border border-white/6 bg-surface p-6 space-y-4">
        <div>
          <label className="block text-sm text-text-muted">Диалог для анализа</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            {conversations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.peerName ?? c.id} · {c.channel}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={busy || !selectedId}
          className="rounded-[10px] bg-accent px-4 py-2.5 text-sm font-medium text-[#042f2e] disabled:opacity-50"
        >
          {busy ? "Анализ…" : "Запустить анализ"}
        </button>
      </section>

      {result && (
        <section className="rounded-[14px] border border-white/6 bg-surface p-6 space-y-4">
          <div>
            <h2 className="font-semibold">Вывод</h2>
            <p className="mt-2 text-sm text-text-secondary">{result.summary}</p>
            <p className="mt-1 text-xs text-text-muted">Модель: {result.model}</p>
          </div>
          <div>
            <h2 className="font-semibold">Рекомендации</h2>
            <ul className="mt-3 space-y-3">
              {result.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="rounded-[10px] border border-white/6 bg-elevated/50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={s.priority} />
                    <span className="font-medium text-sm">{s.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{s.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors =
    priority === "high"
      ? "bg-red-500/20 text-red-300"
      : priority === "low"
        ? "bg-white/10 text-text-muted"
        : "bg-amber-500/20 text-amber-300";
  const label =
    priority === "high" ? "важно" : priority === "low" ? "низкий" : "средний";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${colors}`}>
      {label}
    </span>
  );
}
