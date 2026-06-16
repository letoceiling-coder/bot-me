"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import { NotificationsBell } from "@/components/notifications-bell";
import type { AuthUser } from "@botme/shared";

const nav = [
  { href: "/dashboard", label: "Обзор" },
  { href: "/dashboard/inbox", label: "Диалоги" },
  { href: "/dashboard/assistants", label: "Ассистенты" },
  { href: "/dashboard/integrations", label: "Интеграции" },
  { href: "/dashboard/knowledge", label: "База знаний" },
  { href: "/dashboard/leads", label: "Лиды" },
  { href: "/dashboard/settings", label: "Настройки" },
];

const adminNav = [
  { href: "/dashboard/coach", label: "Coach" },
  { href: "/dashboard/audit", label: "Аудит" },
];

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const planLabel =
    user.organization.plan === "start"
      ? "Start"
      : user.organization.plan === "pro"
        ? "Pro"
        : user.organization.plan === "business"
          ? "Business"
          : user.organization.plan;

  const isOrgAdmin = user.role === "OWNER" || user.role === "ADMIN";

  return (
    <div className="flex min-h-screen bg-base">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/6 bg-elevated lg:flex">
        <div className="flex h-14 items-center border-b border-white/6 px-5">
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight"
          >
            bot<span className="text-accent">me</span>
          </Link>
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
          {isOrgAdmin &&
            adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[10px] px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="border-t border-white/6 p-4 text-sm">
          <p className="text-text-primary">{user.name ?? user.email}</p>
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.push("/");
            }}
            className="mt-2 text-text-muted hover:text-accent"
          >
            Выйти
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-white/6 bg-elevated px-4 lg:px-6">
          <p className="text-sm text-text-muted lg:hidden">botme</p>
          <div className="ml-auto flex items-center gap-3">
            <NotificationsBell />
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              Тариф {planLabel}
            </span>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-text-secondary"
              title={user.email}
            >
              {(user.name ?? user.email).slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
