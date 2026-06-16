"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AuditLogDto } from "@botme/shared";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<AuditLogDto[]>("/audit")
      .then(setLogs)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Журнал аудита
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Просмотры диалогов и действия администраторов
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-[14px] border border-white/6">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Действие</th>
              <th className="px-4 py-3 font-medium">Ресурс</th>
              <th className="px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 bg-surface/50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                  Записей пока нет
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">{actionLabel(log.action)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">
                    {log.resource}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(log.createdAt).toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    view_conversation: "Просмотр диалога",
    "admin.view_conversation": "Админ: просмотр диалога",
    takeover: "Перехват диалога",
    "coach.analyze": "Coach-анализ",
  };
  return map[action] ?? action;
}
