import Link from "next/link";

const nav = [
  { href: "/", label: "Обзор" },
  { href: "/inbox", label: "Диалоги" },
  { href: "/assistants", label: "Ассистенты" },
  { href: "/integrations", label: "Интеграции" },
  { href: "/knowledge", label: "База знаний" },
  { href: "/leads", label: "Лиды" },
  { href: "/settings", label: "Настройки" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/6 bg-elevated lg:flex">
        <div className="flex h-14 items-center border-b border-white/6 px-5">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            bot<span className="text-accent">me</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-[10px] px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-white/6 bg-elevated px-4 lg:px-6">
          <p className="text-sm text-text-muted lg:hidden">botme</p>
          <div className="ml-auto flex items-center gap-3">
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              Тариф Start
            </span>
            <div className="h-8 w-8 rounded-full bg-muted" aria-hidden />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
