"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { TestChatMessage, TestChatResponse } from "@botme/shared";

export function TestChatPanel({
  assistantId,
  knowledgeBaseId,
}: {
  assistantId: string;
  knowledgeBaseId: string | null;
}) {
  const [messages, setMessages] = useState<TestChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSources, setLastSources] = useState<
    TestChatResponse["sources"]
  >([]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: TestChatMessage = { role: "user", content: input.trim() };
    const history = messages;
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<TestChatResponse>(
        `/assistants/${assistantId}/test-chat`,
        {
          method: "POST",
          body: JSON.stringify({ message: userMsg.content, history }),
        },
      );
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      setLastSources(res.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка чата");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[14px] border border-white/6 bg-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">Тестовый чат</h2>
        {!knowledgeBaseId && (
          <span className="text-xs text-amber-400/90">
            База знаний не привязана — ответы без RAG
          </span>
        )}
      </div>

      <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-[10px] border border-white/6 bg-elevated p-3">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted">
            Задайте вопрос, как клиент — проверьте ответ ассистента
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-[10px] px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-accent/15 text-text-primary"
                : "border-l-[3px] border-accent bg-base/50 text-text-secondary"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-xs text-text-muted">Ассистент печатает…</p>}
      </div>

      {lastSources.length > 0 && (
        <div className="mb-3 rounded-[10px] bg-accent/5 p-3 text-xs text-text-muted">
          <p className="mb-1 font-medium text-accent">Источники из базы знаний:</p>
          {lastSources.map((s, i) => (
            <p key={i} className="mt-1">
              {s.documentTitle}: {s.excerpt.slice(0, 120)}…
            </p>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Например: сколько стоит доставка?"
          className="flex-1 rounded-[10px] border border-white/10 bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-[#042f2e] disabled:opacity-50"
        >
          Отправить
        </button>
      </form>
    </section>
  );
}
