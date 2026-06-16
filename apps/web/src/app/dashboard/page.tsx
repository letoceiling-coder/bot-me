export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-muted">Добро пожаловать</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          Личный кабинет
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Интеграции" value="0" hint="Подключите Avito или Telegram" />
        <StatCard title="Ассистенты" value="0" hint="Создайте первого ассистента" />
        <StatCard title="Диалоги сегодня" value="0" hint="Появятся после подключения каналов" />
      </div>
      <section className="rounded-[14px] border border-white/6 bg-surface p-6">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">
          Быстрый старт
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-text-secondary">
          <li>Выберите тариф и оплатите подписку</li>
          <li>Подключите Telegram или Avito — укажите свои API-данные</li>
          <li>Загрузите базу знаний и протестируйте ассистента</li>
        </ol>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/6 bg-surface p-5 transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <p className="text-sm text-text-muted">{title}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-text-secondary">{hint}</p>
    </div>
  );
}
