"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { AssistantDto } from "@botme/shared";

export default function AssistantsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AssistantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<AssistantDto[]>("/assistants")
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string, name: string) {
    if (!confirm(`Удалить ассистента «${name}»?`)) return;
    await apiFetch(`/assistants/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return <p className="text-text-muted">Загрузка…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Ассистенты
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Настройте AI-ассистентов с пресетами и инструментами
          </p>
        </div>
        <Link
          href="/dashboard/assistants/new"
          className="rounded-[10px] bg-accent px-4 py-2.5 text-sm font-medium text-[#042f2e]"
        >
          + Создать ассистента
        </Link>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="rounded-[14px] border border-white/6 bg-surface p-8 text-center">
          <p className="text-text-secondary">Пока нет ассистентов</p>
          <Link
            href="/dashboard/assistants/new"
            className="mt-4 inline-block text-accent hover:underline"
          >
            Создать первого ассистента
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="rounded-[14px] border border-white/6 bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-text-primary">{a.name}</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Пресет: {a.presetId ?? "—"} ·{" "}
                    {a.isActive ? (
                      <span className="text-accent">активен</span>
                    ) : (
                      <span>неактивен</span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    Инструментов: {a.tools.filter((t) => t.enabled).length}
                  </p>
                </div>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                  {a.modelConfig?.model?.split("/").pop() ?? "gpt-4o-mini"}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/assistants/${a.id}`)}
                  className="flex-1 rounded-[10px] border border-white/10 py-2 text-sm hover:border-accent/40"
                >
                  Настроить
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id, a.name)}
                  className="rounded-[10px] border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
