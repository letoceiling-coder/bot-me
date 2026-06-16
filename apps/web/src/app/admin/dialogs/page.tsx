"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { InboxMessageDto } from "@botme/shared";

type AdminConversation = {
  id: string;
  organizationId: string;
  organizationName: string;
  channel: string;
  peerName: string | null;
  status: string;
  lastMessageAt: string;
  preview: string | null;
  messageCount: number;
};

export default function AdminDialogsPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<AdminConversation[]>("/admin/org-viewer/conversations")
      .then((list) => {
        setConversations(list);
        if (list[0]) setSelectedId(list[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    apiFetch<InboxMessageDto[]>(
      `/admin/org-viewer/conversations/${selectedId}/messages`,
    )
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [selectedId]);

  const selected = conversations.find((c) => c.id === selectedId);

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Диалоги организаций
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Просмотр всех переписок · каждый просмотр пишется в аудит
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex min-h-[480px] overflow-hidden rounded-[14px] border border-white/6 bg-surface">
        <aside className="w-full max-w-md shrink-0 border-r border-white/6 overflow-y-auto">
          <ul className="divide-y divide-white/6">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-white/5 ${
                    selectedId === c.id ? "bg-accent/5" : ""
                  }`}
                >
                  <p className="text-xs text-accent">{c.organizationName}</p>
                  <p className="font-medium text-sm">{c.peerName ?? "—"}</p>
                  <p className="text-xs text-text-muted">
                    {c.channel} · {c.messageCount} сообщ.
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="min-w-0 flex-1 p-4">
          {selected ? (
            <div className="space-y-3">
              <p className="font-semibold">
                {selected.organizationName} — {selected.peerName}
              </p>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-[10px] border border-white/6 bg-elevated/50 px-3 py-2 text-sm"
                >
                  <span className="text-xs text-text-muted">{m.role}: </span>
                  {m.content}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted">Выберите диалог</p>
          )}
        </main>
      </div>
    </div>
  );
}
