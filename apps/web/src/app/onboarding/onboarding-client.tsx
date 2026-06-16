"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";
import type { BillingStatus, TariffPlanDto } from "@botme/shared";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [tariffs, setTariffs] = useState<TariffPlanDto[]>([]);
  const [selected, setSelected] = useState("start");
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    apiFetch<TariffPlanDto[]>("/tariffs").then(setTariffs);
    apiFetch<BillingStatus>("/billing/status").then((s) => {
      setBilling(s);
      if (s.subscriptionStatus === "active") {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  useEffect(() => {
    if (searchParams.get("step") === "done") {
      setStep(3);
      apiFetch("/billing/sync", { method: "POST" })
        .then(() => apiFetch<BillingStatus>("/billing/status"))
        .then(setBilling);
    }
  }, [searchParams]);

  async function pay() {
    setError("");
    setLoading(true);
    try {
      const { confirmationUrl } = await apiFetch<{ confirmationUrl?: string }>(
        "/billing/checkout",
        {
          method: "POST",
          body: JSON.stringify({ tariffSlug: selected }),
        },
      );
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
      } else {
        setError("Не получена ссылка на оплату");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка оплаты");
    } finally {
      setLoading(false);
    }
  }

  const selectedTariff = tariffs.find((t) => t.slug === selected);

  return (
    <div className="min-h-screen bg-base px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-bold">
          bot<span className="text-accent">me</span>
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl font-bold">
          Настройка аккаунта
        </h1>
        <p className="mt-2 text-text-secondary">
          Шаг {step} из 3 — выберите тариф и активируйте подписку
        </p>

        <div className="mt-6 flex gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-white/10"}`}
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="mt-8 space-y-4">
            <h2 className="font-semibold">Выберите тариф</h2>
            <div className="grid gap-3">
              {tariffs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.slug)}
                  className={`rounded-[14px] border p-4 text-left transition-colors ${
                    selected === t.slug
                      ? "border-accent/50 bg-accent/5"
                      : "border-white/6 bg-surface hover:border-white/12"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t.name}</span>
                    <span className="font-[family-name:var(--font-display)] text-lg font-bold">
                      {(t.priceMonthly / 100).toLocaleString("ru-RU")} ₽/мес
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{t.description}</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-4 w-full rounded-[10px] bg-accent py-3 font-medium text-[#042f2e]"
            >
              Далее
            </button>
          </div>
        )}

        {step === 2 && selectedTariff && (
          <div className="mt-8 space-y-4 rounded-[14px] border border-white/6 bg-surface p-6">
            <h2 className="font-semibold">Оплата подписки</h2>
            <p className="text-text-secondary">
              Тариф <strong>{selectedTariff.name}</strong> —{" "}
              {(selectedTariff.priceMonthly / 100).toLocaleString("ru-RU")} ₽ в месяц. Оплата
              через ЮKassa.
            </p>
            {billing?.pendingPaymentUrl && (
              <a
                href={billing.pendingPaymentUrl}
                className="block rounded-[10px] border border-accent/40 py-3 text-center text-accent"
              >
                Продолжить незавершённую оплату
              </a>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-[10px] border border-white/10 py-3"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={pay}
                disabled={loading}
                className="flex-1 rounded-[10px] bg-accent py-3 font-medium text-[#042f2e] disabled:opacity-50"
              >
                {loading ? "Создание платежа…" : "Оплатить"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8 space-y-4 rounded-[14px] border border-accent/30 bg-accent/5 p-6 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {billing?.subscriptionStatus === "active"
                ? "Подписка активна!"
                : "Ожидаем подтверждение оплаты"}
            </h2>
            <p className="text-text-secondary">
              {billing?.subscriptionStatus === "active"
                ? "Можно перейти в личный кабинет и подключить каналы."
                : "Если оплата прошла, обновите страницу через минуту."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-[10px] bg-accent px-6 py-3 font-medium text-[#042f2e]"
            >
              В личный кабинет
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
