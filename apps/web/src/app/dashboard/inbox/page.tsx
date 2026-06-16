"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { InboxConversationDto, InboxMessageDto } from "@botme/shared";

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadConversations() {
    const data = await apiFetch<InboxConversationDto[]>("/inbox/conversations");
    setConversations(data);
    if (!selectedId && data[0]) setSelectedId(data[0].id);
  }

  useEffect(() => {
    loadConversations()
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
    const timer = setInterval(() => {
      loadConversations().catch(() => null);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    apiFetch<InboxMessageDto[]>(`/inbox/conversations/${selectedId}/messages`)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [selectedId]);

  const selected = conversations.find((c) => c.id === selectedId);

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Диалоги
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Все переписки из подключённых каналов
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="flex min-h-[480px] overflow-hidden rounded-[14px] border border-white/6 bg-surface">
        <aside className="w-full max-w-sm shrink-0 border-r border-white/6">
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-text-muted">
              Диалогов пока нет. Подключите Telegram в{" "}
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
                      <span className="font-medium text-sm truncate">
                        {c.peerName ?? "Без имени"}
                      </span>
                      <ChannelBadge channel={c.channel} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                      {c.preview ?? "—"}
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">
                      {new Date(c.lastMessageAt).toLocaleString("ru-RU")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="hidden min-w-0 flex-1 flex-col lg:flex">
          {selected ? (
            <>
              <div className="border-b border-white/6 px-4 py-3">
                <p className="font-semibold">{selected.peerName}</p>
                <p className="text-xs text-text-muted">
                  {selected.messageCount} сообщений · {selected.status}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-[12px] px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "ml-auto border-l-[3px] border-accent bg-elevated text-text-secondary"
                        : "bg-accent/10 text-text-primary"
                    }`}
                  >
                    {m.content}
                    <p className="mt-1 text-[10px] text-text-muted">
                      {new Date(m.createdAt).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
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
