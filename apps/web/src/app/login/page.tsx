"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "@/lib/api";
import type { AuthUser } from "@botme/shared";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("dsc-23@yandex.ru");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: AuthUser }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      if (!data.user.isPlatformAdmin) {
        setError("Нет прав администратора платформы");
        return;
      }
      setToken(data.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-[14px] border border-white/6 bg-surface p-8"
      >
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Вход в админ-панель
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          botme · только для администраторов
        </p>
        {error && (
          <p className="mt-4 rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <label className="mt-6 block text-sm text-text-muted">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 text-text-primary outline-none focus:border-accent"
          required
        />
        <label className="mt-4 block text-sm text-text-muted">Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 text-text-primary outline-none focus:border-accent"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-[10px] bg-accent py-2.5 font-medium text-[#042f2e] disabled:opacity-50"
        >
          {loading ? "Вход…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
