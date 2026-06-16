"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { AssistantDto, TelegramIntegrationDto } from "@botme/shared";

export default function IntegrationsPage() {
  const [telegram, setTelegram] = useState<TelegramIntegrationDto | null>(null);
  const [assistants, setAssistants] = useState<AssistantDto[]>([]);
  const [botToken, setBotToken] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [tg, list] = await Promise.all([
      apiFetch<TelegramIntegrationDto>("/integrations/telegram"),
      apiFetch<AssistantDto[]>("/assistants"),
    ]);
    setTelegram(tg);
    setAssistants(list);
    if (!assistantId && tg.assistantId) setAssistantId(tg.assistantId);
    else if (!assistantId && list[0]) setAssistantId(list[0].id);
  }

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const tg = await apiFetch<TelegramIntegrationDto>("/integrations/telegram", {
        method: "PUT",
        body: JSON.stringify({
          botToken: botToken.trim() || undefined,
          assistantId,
        }),
      });
      setTelegram(tg);
      setBotToken("");
      setMsg("Токен сохранён");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    setBusy(true);
    setError("");
    try {
      setTelegram(await apiFetch("/integrations/telegram/connect", { method: "POST" }));
      setMsg("Telegram подключён — webhook установлен");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      setTelegram(await apiFetch("/integrations/telegram/disconnect", { method: "POST" }));
      setMsg("Telegram отключён");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  const connected = telegram?.status === "CONNECTED";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Интеграции
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Подключите каналы — каждый клиент использует свой bot token
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
      {msg && (
        <p className="rounded-[10px] bg-accent/10 px-3 py-2 text-sm text-accent">{msg}</p>
      )}

      <section className="rounded-[14px] border border-white/6 bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Telegram</h2>
            <p className="mt-1 text-sm text-text-muted">
              Создайте бота через @BotFather и вставьте токен
            </p>
          </div>
          <StatusPulse connected={connected} label={telegram?.status ?? "DISCONNECTED"} />
        </div>

        {telegram?.botUsername && (
          <p className="mt-3 text-sm">
            Бот:{" "}
            <span className="text-accent">@{telegram.botUsername}</span>
            {telegram.tokenMasked && (
              <span className="ml-2 text-text-muted">· {telegram.tokenMasked}</span>
            )}
          </p>
        )}

        {telegram?.lastError && (
          <p className="mt-2 text-sm text-red-400">{telegram.lastError}</p>
        )}

        <form onSubmit={save} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-text-muted">Токен бота</label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={telegram?.hasToken ? "Новый токен (оставьте пустым)" : "123456:ABC-DEF..."}
              className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted">Ассистент для ответов</label>
            <select
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
              required
            >
              {assistants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {!assistants.length && (
              <p className="mt-1 text-xs text-amber-400">
                <Link href="/dashboard/assistants/new" className="underline">
                  Создайте ассистента
                </Link>
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={busy || (!botToken.trim() && !telegram?.hasToken)}
            className="rounded-[10px] border border-white/10 px-4 py-2 text-sm hover:border-accent/40 disabled:opacity-50"
          >
            Сохранить настройки
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-3">
          {!connected ? (
            <button
              type="button"
              onClick={connect}
              disabled={busy || !telegram?.hasToken}
              className="rounded-[10px] bg-accent px-4 py-2.5 text-sm font-medium text-[#042f2e] disabled:opacity-50"
            >
              Подключить webhook
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="rounded-[10px] border border-red-500/30 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
            >
              Отключить
            </button>
          )}
          <Link
            href="/dashboard/inbox"
            className="rounded-[10px] border border-white/10 px-4 py-2.5 text-sm hover:border-accent/40"
          >
            Открыть диалоги →
          </Link>
        </div>
      </section>

      <section className="rounded-[14px] border border-dashed border-white/10 p-6 text-sm text-text-muted">
        Avito, VK, MAX — в следующих обновлениях (S6+)
      </section>
    </div>
  );
}

function StatusPulse({ connected, label }: { connected: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          connected ? "bg-accent animate-pulse" : "bg-text-muted"
        }`}
      />
      <span className={connected ? "text-accent" : "text-text-muted"}>
        {connected ? "Подключено" : label === "ERROR" ? "Ошибка" : "Не подключено"}
      </span>
    </div>
  );
}
