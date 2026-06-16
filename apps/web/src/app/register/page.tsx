"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "@/lib/api";
import type { AuthUser } from "@botme/shared";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: AuthUser }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      setToken(data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-8">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-[14px] border border-white/6 bg-surface p-8"
      >
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-bold">
          bot<span className="text-accent">me</span>
        </Link>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold">
          Регистрация
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Войти
          </Link>
        </p>
        {error && (
          <p className="mt-4 rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <label className="mt-6 block text-sm text-text-muted">Название компании</label>
        <input
          value={form.organizationName}
          onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
          className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 outline-none focus:border-accent"
          placeholder="ИП Иванов"
          required
        />
        <label className="mt-4 block text-sm text-text-muted">Ваше имя</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 outline-none focus:border-accent"
          placeholder="Иван"
        />
        <label className="mt-4 block text-sm text-text-muted">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 outline-none focus:border-accent"
          required
        />
        <label className="mt-4 block text-sm text-text-muted">Пароль (мин. 8 символов)</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="mt-1 w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2.5 outline-none focus:border-accent"
          minLength={8}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-[10px] bg-accent py-2.5 font-medium text-[#042f2e] disabled:opacity-50"
        >
          {loading ? "Создание…" : "Создать аккаунт"}
        </button>
      </form>
    </div>
  );
}
