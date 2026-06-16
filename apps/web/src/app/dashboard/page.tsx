"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { BillingStatus, DashboardOverview } from "@botme/shared";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardOverview | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    percent: number;
    period: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardOverview>("/dashboard/overview"),
      apiFetch<BillingStatus>("/billing/status"),
      apiFetch<{ used: number; limit: number; percent: number; period: string }>(
        "/billing/usage",
      ).catch(() => null),
    ]).then(([s, b, u]) => {
      setStats(s);
      setBilling(b);
      if (u) setUsage(u);
    });
  }, []);

  const planName = billing?.tariff?.name ?? billing?.plan ?? "Start";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-muted">Добро пожаловать</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          Личный кабинет
        </h1>
        {billing?.expiresAt && (
          <p className="mt-1 text-sm text-text-secondary">
            Тариф {planName} · активен до{" "}
            {new Date(billing.expiresAt).toLocaleDateString("ru-RU")}
          </p>
        )}
        {usage && (
          <p className="mt-1 text-sm text-text-secondary">
            Сообщения LLM: {usage.used} / {usage.limit} ({usage.percent}% за{" "}
            {usage.period})
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Интеграции"
          value={String(stats?.integrations ?? 0)}
          hint="Подключите Avito или Telegram"
          href="/dashboard/integrations"
        />
        <StatCard
          title="Ассистенты"
          value={String(stats?.assistants ?? 0)}
          hint="Создайте первого ассистента"
          href="/dashboard/assistants"
        />
        <StatCard
          title="Диалоги сегодня"
          value={String(stats?.conversationsToday ?? 0)}
          hint="Появятся после подключения каналов"
          href="/dashboard/inbox"
        />
      </div>

      <section className="rounded-[14px] border border-white/6 bg-surface p-6">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">
          Быстрый старт
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-text-secondary">
          <li>
            {billing?.subscriptionStatus === "active"
              ? "✓ Подписка активна"
              : "Выберите тариф и оплатите подписку"}
          </li>
          <li>
            <Link href="/dashboard/integrations" className="text-accent hover:underline">
              Подключите Telegram или Avito
            </Link>{" "}
            — укажите свои API-данные
          </li>
          <li>
            <Link href="/dashboard/assistants" className="text-accent hover:underline">
              Создайте ассистента
            </Link>{" "}
            и загрузите базу знаний
          </li>
        </ol>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[14px] border border-white/6 bg-surface p-5 transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    >
      <p className="text-sm text-text-muted">{title}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-text-secondary">{hint}</p>
    </Link>
  );
}
