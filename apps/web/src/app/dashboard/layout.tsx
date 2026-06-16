"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch, clearToken, getToken } from "@/lib/api";
import type { AuthUser } from "@botme/shared";
import { AppShell } from "@/components/app-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    apiFetch<AuthUser>("/auth/me")
      .then((u) => {
        if (u.isPlatformAdmin) {
          router.replace("/admin");
          return;
        }
        setUser(u);
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
  }, [router, pathname]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base text-text-muted">
        Загрузка…
      </div>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}
