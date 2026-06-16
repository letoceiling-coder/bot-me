"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminSettingsPage() {
  const [yukassa, setYukassa] = useState({
    shopId: "",
    secretKey: "",
    sandbox: true,
  });
  const [neeklo, setNeeklo] = useState({ apiKey: "", baseUrl: "https://api.neeklo.ru" });
  const [msg, setMsg] = useState("");
  const [testResult, setTestResult] = useState<{
    yukassa: { ok: boolean; message: string };
    neeklo: { ok: boolean; message: string };
  } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ shopId: string; sandbox: boolean; hasSecret: boolean }>(
        "/admin/settings/yukassa",
      ),
      apiFetch<{ baseUrl: string; hasApiKey: boolean }>("/admin/settings/neeklo"),
    ]).then(([y, n]) => {
      setYukassa((s) => ({ ...s, shopId: y.shopId, sandbox: y.sandbox }));
      setNeeklo((s) => ({ ...s, baseUrl: n.baseUrl }));
    });
  }, []);

  async function saveYukassa(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/admin/settings/yukassa", {
        method: "PUT",
        body: JSON.stringify(yukassa),
      });
      setMsg("ЮKassa сохранена");
      setYukassa((s) => ({ ...s, secretKey: "" }));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Ошибка");
    }
  }

  async function saveNeeklo(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/admin/settings/neeklo", {
        method: "PUT",
        body: JSON.stringify(neeklo),
      });
      setMsg("Neeklo API сохранён");
      setNeeklo((s) => ({ ...s, apiKey: "" }));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Ошибка");
    }
  }

  async function testKeys() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await apiFetch<{
        yukassa: { ok: boolean; message: string };
        neeklo: { ok: boolean; message: string };
      }>("/admin/settings/test", { method: "POST" });
      setTestResult(result);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Ошибка проверки");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
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
          {testing ? "Проверка…" : "Проверить ключи"}
        </button>
      </div>
      {msg && <p className="text-sm text-accent">{msg}</p>}
      {testResult && (
        <div className="space-y-2 rounded-[14px] border border-white/6 bg-surface p-4 text-sm">
          <p className={testResult.yukassa.ok ? "text-green-400" : "text-red-400"}>
            ЮKassa: {testResult.yukassa.message}
          </p>
          <p className={testResult.neeklo.ok ? "text-green-400" : "text-red-400"}>
            Neeklo: {testResult.neeklo.message}
          </p>
        </div>
      )}

      <form onSubmit={saveYukassa} className="space-y-3 rounded-[14px] border border-white/6 bg-surface p-6">
        <h2 className="font-semibold">ЮKassa</h2>
        <p className="text-xs text-text-muted">Только администраторы. Секрет хранится зашифрованно.</p>
        <input
          placeholder="Shop ID"
          value={yukassa.shopId}
          onChange={(e) => setYukassa({ ...yukassa, shopId: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <input
          type="password"
          placeholder="Secret key (оставьте пустым, чтобы не менять)"
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
          Песочница (sandbox)
        </label>
        <button type="submit" className="rounded-[10px] bg-accent px-4 py-2 text-[#042f2e]">
          Сохранить ЮKassa
        </button>
      </form>

      <form onSubmit={saveNeeklo} className="space-y-3 rounded-[14px] border border-white/6 bg-surface p-6">
        <h2 className="font-semibold">Neeklo Platform API</h2>
        <p className="text-xs text-text-muted">
          Парсер, генерация фото/видео, тестировщик — см. API.md
        </p>
        <input
          placeholder="Base URL"
          value={neeklo.baseUrl}
          onChange={(e) => setNeeklo({ ...neeklo, baseUrl: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <input
          type="password"
          placeholder="API key (x-api-key)"
          value={neeklo.apiKey}
          onChange={(e) => setNeeklo({ ...neeklo, apiKey: e.target.value })}
          className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <button type="submit" className="rounded-[10px] bg-accent px-4 py-2 text-[#042f2e]">
          Сохранить Neeklo
        </button>
      </form>
    </div>
  );
}
