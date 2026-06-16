"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch, fetchCurrentUser, getToken, isUnauthorized } from "@/lib/api";
import type { AuthUser, BillingStatus } from "@botme/shared";
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

    fetchCurrentUser()
      .then(async (u) => {
        let billing: BillingStatus | null = null;
        try {
          billing = await apiFetch<BillingStatus>("/billing/status");
        } catch {
          /* биллинг не должен рвать сессию */
        }
        if (billing && billing.subscriptionStatus !== "active") {
          router.replace("/onboarding");
          return;
        }
        setUser(u);
      })
      .catch((err) => {
        if (isUnauthorized(err)) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
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
