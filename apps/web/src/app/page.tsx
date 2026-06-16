import Link from "next/link";
import type { TariffPlanDto } from "@botme/shared";
import { LandingAuthNav } from "@/components/landing-auth-nav";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bot-me.neeklo.ru";

async function getTariffs(): Promise<TariffPlanDto[]> {
  try {
    const res = await fetch(`${API_URL}/api/tariffs`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const features = [
  {
    title: "Мультиканальность",
    text: "Avito, Telegram, VK и MAX — клиенты пишут где удобно, ассистент отвечает везде.",
  },
  {
    title: "База знаний",
    text: "Загрузите прайс, FAQ и документы — ассистент отвечает по вашим материалам.",
  },
  {
    title: "CRM-lite",
    text: "Лиды и клиенты собираются автоматически из диалогов, без таблиц и хаоса.",
  },
  {
    title: "Coach agent",
    text: "Подсказки по улучшению ответов и качеству обслуживания на Pro и Business.",
  },
  {
    title: "Операторы",
    text: "Перехватите диалог в один клик, когда нужен живой человек.",
  },
  {
    title: "Ваши ключи",
    text: "Каждый клиент подключает свои API Avito и Telegram — данные изолированы.",
  },
];

export default async function LandingPage() {
  const tariffs = await getTariffs();

  return (
    <div className="min-h-screen bg-base">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link href="/" className="font-[family-name:var(--font-display)] text-xl font-bold">
            bot<span className="text-accent">me</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
            <a href="#features" className="hover:text-text-primary">Возможности</a>
            <a href="#tariffs" className="hover:text-text-primary">Тарифы</a>
          </nav>
          <LandingAuthNav variant="header" />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              AI Business Desk для малого бизнеса
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.05] tracking-tight lg:text-5xl">
              Ваш бизнес не спит —{" "}
              <span className="text-accent">и ассистент тоже</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-text-secondary">
              botme отвечает клиентам в Avito и Telegram, знает ваш прайс и не теряет
              заявки. Настройка за 15 минут без программиста.
            </p>
            <LandingAuthNav variant="hero" />
          </div>
          <div className="rounded-[20px] border border-white/6 bg-gradient-to-br from-surface to-elevated p-6">
            <p className="mb-4 text-xs text-text-muted">Пример диалога</p>
            <div className="space-y-3">
              <div className="max-w-[85%] rounded-[12px] border-l-[3px] border-accent bg-elevated px-4 py-3 text-sm text-text-secondary">
                Здравствуйте! Интересует доставка по Москве — сколько стоит?
              </div>
              <div className="ml-auto max-w-[85%] rounded-[12px] bg-accent/10 px-4 py-3 text-sm">
                Доставка по Москве — от 490 ₽, срок 1–2 дня. Могу оформить заявку?
              </div>
              <div className="max-w-[85%] rounded-[12px] border-l-[3px] border-accent bg-elevated px-4 py-3 text-sm text-text-secondary">
                Да, на завтра. Телефон 8-999-123-45-67
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-white/6 bg-elevated/50 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Всё для продаж в одном кабинете
          </h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Не просто чат-бот — полноценный рабочий стол: каналы, обучение, CRM и аналитика.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[14px] border border-white/6 bg-surface p-6 transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
              >
                <h3 className="font-[family-name:var(--font-display)] font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tariffs" className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">Тарифы</h2>
          <p className="mt-3 text-text-secondary">
            Выберите план после регистрации. Оплата через ЮKassa.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {tariffs.map((t) => (
              <div
                key={t.id}
                className={`rounded-[14px] border p-6 ${
                  t.isFeatured
                    ? "border-accent/40 bg-accent/5"
                    : "border-white/6 bg-surface"
                }`}
              >
                {t.isFeatured && (
                  <span className="text-xs font-medium text-gold">Рекомендуем</span>
                )}
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
                  {t.name}
                </h3>
                <p className="mt-1 text-sm text-text-muted">{t.description}</p>
                <p className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold">
                  {(t.priceMonthly / 100).toLocaleString("ru-RU")} ₽
                  <span className="text-base font-normal text-text-muted">/мес</span>
                </p>
                {Array.isArray(t.features) && (
                  <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                    {(t.features as string[]).map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/register"
                  className={`mt-6 block rounded-[10px] py-2.5 text-center text-sm font-medium ${
                    t.isFeatured
                      ? "bg-accent text-[#042f2e]"
                      : "border border-white/10 hover:border-accent/40"
                  }`}
                >
                  Выбрать
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/6 bg-elevated py-16">
        <div className="mx-auto max-w-6xl px-4 text-center lg:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Готовы не терять клиентов?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-text-secondary">
            Создайте аккаунт, подключите канал и загрузите базу знаний — ассистент начнёт
            работать сегодня.
          </p>
          <LandingAuthNav variant="footer" />
        </div>
      </section>

      <footer className="border-t border-white/6 py-8 text-center text-sm text-text-muted">
        © {new Date().getFullYear()} botme · neeklo.ru
      </footer>
    </div>
  );
}
