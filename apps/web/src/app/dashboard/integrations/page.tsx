"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type {
  AssistantDto,
  AvitoIntegrationDto,
  TelegramIntegrationDto,
} from "@botme/shared";

export default function IntegrationsPage() {
  const [telegram, setTelegram] = useState<TelegramIntegrationDto | null>(null);
  const [avito, setAvito] = useState<AvitoIntegrationDto | null>(null);
  const [assistants, setAssistants] = useState<AssistantDto[]>([]);
  const [botToken, setBotToken] = useState("");
  const [tgAssistantId, setTgAssistantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [profileId, setProfileId] = useState("");
  const [avitoAssistantId, setAvitoAssistantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [tg, av, list] = await Promise.all([
      apiFetch<TelegramIntegrationDto>("/integrations/telegram"),
      apiFetch<AvitoIntegrationDto>("/integrations/avito"),
      apiFetch<AssistantDto[]>("/assistants"),
    ]);
    setTelegram(tg);
    setAvito(av);
    setAssistants(list);
    if (!tgAssistantId && tg.assistantId) setTgAssistantId(tg.assistantId);
    else if (!tgAssistantId && list[0]) setTgAssistantId(list[0].id);
    if (!avitoAssistantId && av.assistantId) setAvitoAssistantId(av.assistantId);
    else if (!avitoAssistantId && list[0]) setAvitoAssistantId(list[0].id);
    if (!profileId && av.profileId) setProfileId(String(av.profileId));
  }

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Интеграции
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Свои ключи для каждого канала — данные шифруются на сервере
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {msg && (
        <p className="rounded-[10px] bg-accent/10 px-3 py-2 text-sm text-accent">
          {msg}
        </p>
      )}

      <TelegramSection
        telegram={telegram}
        assistants={assistants}
        botToken={botToken}
        assistantId={tgAssistantId}
        busy={busy}
        onBotTokenChange={setBotToken}
        onAssistantChange={setTgAssistantId}
        onSave={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setMsg("");
          try {
            const tg = await apiFetch<TelegramIntegrationDto>("/integrations/telegram", {
              method: "PUT",
              body: JSON.stringify({
                botToken: botToken.trim() || undefined,
                assistantId: tgAssistantId,
              }),
            });
            setTelegram(tg);
            setBotToken("");
            setMsg("Telegram: настройки сохранены");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
          } finally {
            setBusy(false);
          }
        }}
        onConnect={async () => {
          setBusy(true);
          setError("");
          try {
            setTelegram(
              await apiFetch("/integrations/telegram/connect", { method: "POST" }),
            );
            setMsg("Telegram подключён");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
          } finally {
            setBusy(false);
          }
        }}
        onDisconnect={async () => {
          setBusy(true);
          setError("");
          try {
            setTelegram(
              await apiFetch("/integrations/telegram/disconnect", { method: "POST" }),
            );
            setMsg("Telegram отключён");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
          } finally {
            setBusy(false);
          }
        }}
      />

      <AvitoSection
        avito={avito}
        assistants={assistants}
        clientId={clientId}
        clientSecret={clientSecret}
        profileId={profileId}
        assistantId={avitoAssistantId}
        busy={busy}
        onClientIdChange={setClientId}
        onClientSecretChange={setClientSecret}
        onProfileIdChange={setProfileId}
        onAssistantChange={setAvitoAssistantId}
        onSave={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setMsg("");
          try {
            const av = await apiFetch<AvitoIntegrationDto>("/integrations/avito", {
              method: "PUT",
              body: JSON.stringify({
                clientId: clientId.trim() || undefined,
                clientSecret: clientSecret.trim() || undefined,
                profileId: profileId ? Number(profileId) : undefined,
                assistantId: avitoAssistantId,
              }),
            });
            setAvito(av);
            setClientId("");
            setClientSecret("");
            setMsg("Avito: настройки сохранены");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
          } finally {
            setBusy(false);
          }
        }}
        onConnect={async () => {
          setBusy(true);
          setError("");
          try {
            setAvito(await apiFetch("/integrations/avito/connect", { method: "POST" }));
            setMsg("Avito подключён");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
          } finally {
            setBusy(false);
          }
        }}
        onDisconnect={async () => {
          setBusy(true);
          setError("");
          try {
            setAvito(
              await apiFetch("/integrations/avito/disconnect", { method: "POST" }),
            );
            setMsg("Avito отключён");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
          } finally {
            setBusy(false);
          }
        }}
      />

      <section className="rounded-[14px] border border-dashed border-white/10 p-6 text-sm text-text-muted">
        VK и MAX — в следующих обновлениях
      </section>
    </div>
  );
}

function TelegramSection({
  telegram,
  assistants,
  botToken,
  assistantId,
  busy,
  onBotTokenChange,
  onAssistantChange,
  onSave,
  onConnect,
  onDisconnect,
}: {
  telegram: TelegramIntegrationDto | null;
  assistants: AssistantDto[];
  botToken: string;
  assistantId: string;
  busy: boolean;
  onBotTokenChange: (v: string) => void;
  onAssistantChange: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connected = telegram?.status === "CONNECTED";

  return (
    <section className="rounded-[14px] border border-white/6 bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Telegram</h2>
          <p className="mt-1 text-sm text-text-muted">Бот через @BotFather</p>
        </div>
        <StatusPulse connected={connected} label={telegram?.status ?? "DISCONNECTED"} />
      </div>

      {telegram?.botUsername && (
        <p className="mt-3 text-sm">
          Бот: <span className="text-accent">@{telegram.botUsername}</span>
          {telegram.tokenMasked && (
            <span className="ml-2 text-text-muted">· {telegram.tokenMasked}</span>
          )}
        </p>
      )}
      {telegram?.lastError && (
        <p className="mt-2 text-sm text-red-400">{telegram.lastError}</p>
      )}

      <form onSubmit={onSave} className="mt-6 space-y-4">
        <Field label="Токен бота">
          <input
            type="password"
            value={botToken}
            onChange={(e) => onBotTokenChange(e.target.value)}
            placeholder={
              telegram?.hasToken ? "Новый токен (оставьте пустым)" : "123456:ABC..."
            }
            className={inputClass}
          />
        </Field>
        <AssistantSelect
          assistants={assistants}
          value={assistantId}
          onChange={onAssistantChange}
        />
        <button
          type="submit"
          disabled={busy || (!botToken.trim() && !telegram?.hasToken)}
          className={btnSecondary}
        >
          Сохранить
        </button>
      </form>

      <ConnectActions
        connected={connected}
        busy={busy}
        canConnect={Boolean(telegram?.hasToken)}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </section>
  );
}

function AvitoSection({
  avito,
  assistants,
  clientId,
  clientSecret,
  profileId,
  assistantId,
  busy,
  onClientIdChange,
  onClientSecretChange,
  onProfileIdChange,
  onAssistantChange,
  onSave,
  onConnect,
  onDisconnect,
}: {
  avito: AvitoIntegrationDto | null;
  assistants: AssistantDto[];
  clientId: string;
  clientSecret: string;
  profileId: string;
  assistantId: string;
  busy: boolean;
  onClientIdChange: (v: string) => void;
  onClientSecretChange: (v: string) => void;
  onProfileIdChange: (v: string) => void;
  onAssistantChange: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connected = avito?.status === "CONNECTED";

  return (
    <section className="rounded-[14px] border border-white/6 bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Avito</h2>
          <p className="mt-1 text-sm text-text-muted">
            Ключи из раздела «Для профессионалов» → API на avito.ru
          </p>
        </div>
        <StatusPulse connected={connected} label={avito?.status ?? "DISCONNECTED"} />
      </div>

      {avito?.clientIdMasked && (
        <p className="mt-3 text-sm text-text-muted">
          Client ID: {avito.clientIdMasked}
          {avito.profileId ? ` · Profile ${avito.profileId}` : ""}
        </p>
      )}
      {avito?.lastError && (
        <p className="mt-2 text-sm text-red-400">{avito.lastError}</p>
      )}

      <form onSubmit={onSave} className="mt-6 space-y-4">
        <Field label="Client ID">
          <input
            value={clientId}
            onChange={(e) => onClientIdChange(e.target.value)}
            placeholder={avito?.hasCredentials ? "Новый Client ID" : "your-client-id"}
            className={inputClass}
          />
        </Field>
        <Field label="Client Secret">
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => onClientSecretChange(e.target.value)}
            placeholder={avito?.hasCredentials ? "Новый secret" : "your-client-secret"}
            className={inputClass}
          />
        </Field>
        <Field label="Profile ID (номер профиля)">
          <input
            value={profileId}
            onChange={(e) => onProfileIdChange(e.target.value)}
            placeholder={avito?.profileId ? String(avito.profileId) : "123456789"}
            className={inputClass}
            required={!avito?.profileId}
          />
        </Field>
        <AssistantSelect
          assistants={assistants}
          value={assistantId}
          onChange={onAssistantChange}
        />
        <button
          type="submit"
          disabled={
            busy ||
            ((!clientId.trim() || !clientSecret.trim()) && !avito?.hasCredentials) ||
            (!profileId && !avito?.profileId)
          }
          className={btnSecondary}
        >
          Сохранить
        </button>
      </form>

      <ConnectActions
        connected={connected}
        busy={busy}
        canConnect={Boolean(avito?.hasCredentials && avito.profileId)}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </section>
  );
}

function AssistantSelect({
  assistants,
  value,
  onChange,
}: {
  assistants: AssistantDto[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label="Ассистент для ответов">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} required>
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
    </Field>
  );
}

function ConnectActions({
  connected,
  busy,
  canConnect,
  onConnect,
  onDisconnect,
}: {
  connected: boolean;
  busy: boolean;
  canConnect: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {!connected ? (
        <button
          type="button"
          onClick={onConnect}
          disabled={busy || !canConnect}
          className="rounded-[10px] bg-accent px-4 py-2.5 text-sm font-medium text-[#042f2e] disabled:opacity-50"
        >
          Подключить webhook
        </button>
      ) : (
        <button
          type="button"
          onClick={onDisconnect}
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
        Диалоги →
      </Link>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-text-muted">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent";
const btnSecondary =
  "rounded-[10px] border border-white/10 px-4 py-2 text-sm hover:border-accent/40 disabled:opacity-50";

function StatusPulse({ connected, label }: { connected: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          connected ? "animate-pulse bg-accent" : "bg-text-muted"
        }`}
      />
      <span className={connected ? "text-accent" : "text-text-muted"}>
        {connected ? "Подключено" : label === "ERROR" ? "Ошибка" : "Не подключено"}
      </span>
    </div>
  );
}
