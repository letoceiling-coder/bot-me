"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch, clearToken, getToken } from "@/lib/api";
import type { AuthUser } from "@botme/shared";

const nav = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/tariffs", label: "Тарифы" },
  { href: "/admin/settings", label: "Настройки" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    apiFetch<AuthUser>("/auth/me")
      .then((u) => {
        if (!u.isPlatformAdmin) {
          clearToken();
          router.replace("/admin/login");
          return;
        }
        setUser(u);
      })
      .catch(() => {
        clearToken();
        router.replace("/admin/login");
      });
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return children;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base text-text-muted">
        Загрузка…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-base">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/6 bg-elevated lg:flex">
        <div className="border-b border-white/6 px-5 py-4">
          <p className="font-[family-name:var(--font-display)] text-lg font-bold">
            bot<span className="text-accent">me</span>
          </p>
          <p className="text-xs text-text-muted">Админ-панель</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-[10px] px-3 py-2.5 text-sm ${
                pathname === item.href
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-white/5"
              }`}
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
              router.push("/admin/login");
            }}
            className="mt-2 text-text-muted hover:text-accent"
          >
            Выйти
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
