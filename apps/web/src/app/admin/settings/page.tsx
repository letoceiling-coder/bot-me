"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type TestLine = { ok: boolean; message: string };

export default function AdminSettingsPage() {
  const [yukassa, setYukassa] = useState({
    shopId: "",
    secretKey: "",
    sandbox: true,
  });
  const [neeklo, setNeeklo] = useState({ apiKey: "", baseUrl: "https://api.neeklo.ru" });
  const [openrouter, setOpenrouter] = useState({
    apiKey: "",
    defaultModel: "openai/gpt-4o-mini",
  });
  const [s3, setS3] = useState({
    endpoint: "https://s3.ru-3.storage.selcloud.ru",
    region: "ru-3",
    bucket: "botme",
    accessKey: "",
    secretKey: "",
  });
  const [msg, setMsg] = useState("");
  const [testResult, setTestResult] = useState<Record<string, TestLine> | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ shopId: string; sandbox: boolean }>("/admin/settings/yukassa"),
      apiFetch<{ baseUrl: string }>("/admin/settings/neeklo"),
      apiFetch<{ defaultModel: string }>("/admin/settings/openrouter"),
      apiFetch<{ endpoint: string; region: string; bucket: string; accessKey: string }>(
        "/admin/settings/s3",
      ),
    ]).then(([y, n, o, s]) => {
      setYukassa((v) => ({ ...v, shopId: y.shopId, sandbox: y.sandbox }));
      setNeeklo((v) => ({ ...v, baseUrl: n.baseUrl }));
      setOpenrouter((v) => ({ ...v, defaultModel: o.defaultModel }));
      setS3((v) => ({
        ...v,
        endpoint: s.endpoint,
        region: s.region,
        bucket: s.bucket,
        accessKey: s.accessKey,
      }));
    });
  }, []);

  async function testKeys() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await apiFetch<Record<string, TestLine>>("/admin/settings/test", {
        method: "POST",
      });
      setTestResult(result);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Ошибка проверки");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Настройки платформы
        </h1>
        <button
          type="button"
          onClick={testKeys}
          disabled={testing}
          className="rounded-[10px] border border-white/10 px-4 py-2 text-sm hover:border-accent/40 disabled:opacity-50"
        >
          {testing ? "Проверка…" : "Проверить все ключи"}
        </button>
      </div>
      {msg && <p className="text-sm text-accent">{msg}</p>}
      {testResult && (
        <div className="space-y-2 rounded-[14px] border border-white/6 bg-surface p-4 text-sm">
          {Object.entries(testResult).map(([key, r]) => (
            <p key={key} className={r.ok ? "text-green-400" : "text-red-400"}>
              {key}: {r.message}
            </p>
          ))}
        </div>
      )}

      <SettingsForm
        title="ЮKassa"
        hint="Приём платежей за подписку"
        onSubmit={async (e) => {
          e.preventDefault();
          await apiFetch("/admin/settings/yukassa", {
            method: "PUT",
            body: JSON.stringify(yukassa),
          });
          setMsg("ЮKassa сохранена");
          setYukassa((v) => ({ ...v, secretKey: "" }));
        }}
      >
        <input
          placeholder="Shop ID"
          value={yukassa.shopId}
          onChange={(e) => setYukassa({ ...yukassa, shopId: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <input
          type="password"
          placeholder="Secret key"
          value={yukassa.secretKey}
          onChange={(e) => setYukassa({ ...yukassa, secretKey: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={yukassa.sandbox}
            onChange={(e) => setYukassa({ ...yukassa, sandbox: e.target.checked })}
          />
          Песочница
        </label>
      </SettingsForm>

      <SettingsForm
        title="OpenRouter (LLM)"
        hint="Модели для ассистентов и тест-чата"
        onSubmit={async (e) => {
          e.preventDefault();
          await apiFetch("/admin/settings/openrouter", {
            method: "PUT",
            body: JSON.stringify(openrouter),
          });
          setMsg("OpenRouter сохранён");
          setOpenrouter((v) => ({ ...v, apiKey: "" }));
        }}
      >
        <input
          placeholder="Модель по умолчанию"
          value={openrouter.defaultModel}
          onChange={(e) => setOpenrouter({ ...openrouter, defaultModel: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <input
          type="password"
          placeholder="API key (sk-or-...)"
          value={openrouter.apiKey}
          onChange={(e) => setOpenrouter({ ...openrouter, apiKey: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
      </SettingsForm>

      <SettingsForm
        title="Selectel S3"
        hint="Хранение файлов базы знаний"
        onSubmit={async (e) => {
          e.preventDefault();
          await apiFetch("/admin/settings/s3", {
            method: "PUT",
            body: JSON.stringify(s3),
          });
          setMsg("S3 сохранён");
          setS3((v) => ({ ...v, secretKey: "" }));
        }}
      >
        <input
          placeholder="Endpoint"
          value={s3.endpoint}
          onChange={(e) => setS3({ ...s3, endpoint: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Регион"
            value={s3.region}
            onChange={(e) => setS3({ ...s3, region: e.target.value })}
            className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
          />
          <input
            placeholder="Бакет"
            value={s3.bucket}
            onChange={(e) => setS3({ ...s3, bucket: e.target.value })}
            className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
          />
        </div>
        <input
          placeholder="Access key"
          value={s3.accessKey}
          onChange={(e) => setS3({ ...s3, accessKey: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <input
          type="password"
          placeholder="Secret key"
          value={s3.secretKey}
          onChange={(e) => setS3({ ...s3, secretKey: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
      </SettingsForm>

      <SettingsForm
        title="Neeklo Platform API"
        hint="Парсер, генерация, тестировщик"
        onSubmit={async (e) => {
          e.preventDefault();
          await apiFetch("/admin/settings/neeklo", {
            method: "PUT",
            body: JSON.stringify(neeklo),
          });
          setMsg("Neeklo API сохранён");
          setNeeklo((v) => ({ ...v, apiKey: "" }));
        }}
      >
        <input
          placeholder="Base URL"
          value={neeklo.baseUrl}
          onChange={(e) => setNeeklo({ ...neeklo, baseUrl: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <input
          type="password"
          placeholder="API key"
          value={neeklo.apiKey}
          onChange={(e) => setNeeklo({ ...neeklo, apiKey: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
      </SettingsForm>
    </div>
  );
}

function SettingsForm({
  title,
  hint,
  children,
  onSubmit,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-[14px] border border-white/6 bg-surface p-6"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="text-xs text-text-muted">{hint}</p>
      {children}
      <button type="submit" className="rounded-[10px] bg-accent px-4 py-2 text-[#042f2e]">
        Сохранить
      </button>
    </form>
  );
}
