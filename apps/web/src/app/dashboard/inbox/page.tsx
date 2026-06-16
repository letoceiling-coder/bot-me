"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { InboxConversationDto, InboxMessageDto } from "@botme/shared";

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessageDto[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadConversations() {
    const data = await apiFetch<InboxConversationDto[]>("/inbox/conversations");
    setConversations(data);
    if (!selectedId && data[0]) setSelectedId(data[0].id);
  }

  async function loadMessages(id: string) {
    const data = await apiFetch<InboxMessageDto[]>(
      `/inbox/conversations/${id}/messages`,
    );
    setMessages(data);
  }

  useEffect(() => {
    loadConversations()
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
    const timer = setInterval(() => {
      loadConversations().catch(() => null);
      if (selectedId) loadMessages(selectedId).catch(() => null);
    }, 15000);
    return () => clearInterval(timer);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedId).catch(() => setMessages([]));
  }, [selectedId]);

  const selected = conversations.find((c) => c.id === selectedId);
  const humanActive = selected?.status === "human_active";

  async function takeover() {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/inbox/conversations/${selectedId}/takeover`, { method: "POST" });
      await loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/inbox/conversations/${selectedId}/release`, { method: "POST" });
      await loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/inbox/conversations/${selectedId}/reply`, {
        method: "POST",
        body: JSON.stringify({ content: replyText.trim() }),
      });
      setReplyText("");
      await Promise.all([loadConversations(), loadMessages(selectedId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Диалоги
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Переписки из Telegram и Avito · перехват диалога оператором
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex min-h-[520px] overflow-hidden rounded-[14px] border border-white/6 bg-surface">
        <aside className="w-full max-w-sm shrink-0 border-r border-white/6">
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-text-muted">
              Диалогов пока нет. Подключите каналы в{" "}
              <a href="/dashboard/integrations" className="text-accent underline">
                интеграциях
              </a>
              .
            </p>
          ) : (
            <ul className="divide-y divide-white/6">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                      selectedId === c.id ? "bg-accent/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {c.peerName ?? "Без имени"}
                      </span>
                      <ChannelBadge channel={c.channel} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                      {c.preview ?? "—"}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-text-muted">
                      <span>{new Date(c.lastMessageAt).toLocaleString("ru-RU")}</span>
                      {c.status === "human_active" && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 text-amber-300">
                          оператор
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="hidden min-w-0 flex-1 flex-col lg:flex">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 px-4 py-3">
                <div>
                  <p className="font-semibold">{selected.peerName}</p>
                  <p className="text-xs text-text-muted">
                    {selected.messageCount} сообщений ·{" "}
                    {humanActive ? "оператор отвечает" : "бот активен"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!humanActive ? (
                    <button
                      type="button"
                      onClick={takeover}
                      disabled={busy}
                      className="rounded-[8px] border border-amber-500/40 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                    >
                      Перехватить
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={release}
                      disabled={busy}
                      className="rounded-[8px] border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
                    >
                      Вернуть боту
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-[12px] px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "ml-auto border-l-[3px] border-accent bg-elevated text-text-secondary"
                        : m.role === "operator"
                          ? "border border-amber-500/30 bg-amber-500/10 text-text-primary"
                          : "bg-accent/10 text-text-primary"
                    }`}
                  >
                    {m.content}
                    <p className="mt-1 text-[10px] text-text-muted">
                      {m.role === "operator" ? "оператор · " : ""}
                      {new Date(m.createdAt).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={sendReply}
                className="flex gap-2 border-t border-white/6 p-4"
              >
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    humanActive
                      ? "Ответ от оператора…"
                      : "Напишите — бот будет приостановлен"
                  }
                  className="min-w-0 flex-1 rounded-[10px] border border-white/10 bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={busy || !replyText.trim()}
                  className="shrink-0 rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-[#042f2e] disabled:opacity-50"
                >
                  Отправить
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
              Выберите диалог
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const label =
    channel === "telegram" ? "TG" : channel === "avito" ? "Avito" : channel;
  return (
    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase text-text-muted">
      {label}
    </span>
  );
}
