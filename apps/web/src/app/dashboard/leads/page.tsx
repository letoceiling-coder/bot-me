"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { LeadDto } from "@botme/shared";

const STAGES: Record<string, string> = {
  new: "Новый",
  contact: "На связи",
  qualified: "Квалифицирован",
  won: "Сделка",
  lost: "Отказ",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<LeadDto[]>("/leads")
      .then(setLeads)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  async function setStage(id: string, stage: string) {
    try {
      const updated = await apiFetch<LeadDto>(`/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      });
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Лиды
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Заявки из диалогов и CRM — создаются автоматически при намерении купить
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {leads.length === 0 ? (
        <div className="rounded-[14px] border border-white/6 bg-surface p-8 text-center text-sm text-text-muted">
          Лидов пока нет. Включите инструмент «Создать лид» у ассистента и дождитесь
          сообщения с телефоном или намерением купить.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-white/6">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Контакт</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6 bg-surface/50">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.name ?? "—"}</p>
                    {lead.note && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
                        {lead.note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {lead.phone ?? lead.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 capitalize text-text-muted">
                    {lead.source ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.stage}
                      onChange={(e) => setStage(lead.id, e.target.value)}
                      className="rounded-[8px] border border-white/10 bg-elevated px-2 py-1 text-xs outline-none focus:border-accent"
                    >
                      {Object.entries(STAGES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(lead.createdAt).toLocaleString("ru-RU")}
                    {lead.conversationId && (
                      <>
                        <br />
                        <Link
                          href="/dashboard/inbox"
                          className="text-accent underline"
                        >
                          Диалог
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
