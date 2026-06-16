"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, fetchCurrentUser, getToken } from "@/lib/api";

type Variant = "header" | "hero" | "footer";

export function LandingAuthNav({ variant = "header" }: { variant?: Variant }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    fetchCurrentUser()
      .then(() => setLoggedIn(true))
      .catch(() => setLoggedIn(false))
      .finally(() => setReady(true));
  }, []);

  function logout() {
    clearToken();
    setLoggedIn(false);
    router.refresh();
  }

  if (!ready) {
    if (variant === "hero") return null;
    return <div className="h-9 w-28" aria-hidden />;
  }

  if (loggedIn) {
    if (variant === "hero") {
      return (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-[10px] bg-accent px-6 py-3 font-medium text-[#042f2e]"
          >
            В личный кабинет
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-[10px] border border-white/10 px-6 py-3 text-text-primary hover:border-accent/40"
          >
            Выйти
          </button>
        </div>
      );
    }

    if (variant === "footer") {
      return (
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-[10px] bg-accent px-8 py-3 font-medium text-[#042f2e]"
        >
          В личный кабинет
        </Link>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-[#042f2e]"
        >
          В кабинет
        </Link>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-text-secondary hover:text-accent"
        >
          Выйти
        </button>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/register"
          className="rounded-[10px] bg-accent px-6 py-3 font-medium text-[#042f2e]"
        >
          Начать бесплатно
        </Link>
        <Link
          href="/login"
          className="rounded-[10px] border border-white/10 px-6 py-3 text-text-primary hover:border-accent/40"
        >
          Уже есть аккаунт
        </Link>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <Link
        href="/register"
        className="mt-8 inline-block rounded-[10px] bg-accent px-8 py-3 font-medium text-[#042f2e]"
      >
        Создать аккаунт
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="text-sm text-text-secondary hover:text-accent">
        Войти
      </Link>
      <Link
        href="/register"
        className="rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-[#042f2e]"
      >
        Регистрация
      </Link>
    </div>
  );
}
