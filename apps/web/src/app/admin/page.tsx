export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        Панель администратора
      </h1>
      <p className="text-text-secondary">
        Управление тарифами и настройками ЮKassa / Neeklo API. Обычные пользователи
        не видят этот раздел.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-text-secondary">
        <li>
          <a href="/admin/tariffs" className="text-accent hover:underline">
            Тарифы
          </a>{" "}
          — создание, редактирование, удаление
        </li>
        <li>
          <a href="/admin/settings" className="text-accent hover:underline">
            Настройки
          </a>{" "}
          — ЮKassa и ключ Neeklo Platform API
        </li>
      </ul>
    </div>
  );
}
