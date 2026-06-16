"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { TariffPlanDto } from "@botme/shared";

const emptyForm = {
  slug: "",
  name: "",
  description: "",
  priceMonthly: 0,
  sortOrder: 0,
  isActive: true,
  isFeatured: false,
};

export default function AdminTariffsPage() {
  const [items, setItems] = useState<TariffPlanDto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await apiFetch<TariffPlanDto[]>("/admin/tariffs");
    setItems(data);
  }

  useEffect(() => {
    load().catch((e) => setMsg(String(e)));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const body = {
      ...form,
      priceMonthly: Number(form.priceMonthly),
      features: [],
      limits: {},
    };
    try {
      if (editId) {
        await apiFetch(`/admin/tariffs/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/admin/tariffs", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setForm(emptyForm);
      setEditId(null);
      await load();
      setMsg("Сохранено");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Ошибка");
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить тариф?")) return;
    await apiFetch(`/admin/tariffs/${id}`, { method: "DELETE" });
    await load();
  }

  function startEdit(t: TariffPlanDto) {
    setEditId(t.id);
    setForm({
      slug: t.slug,
      name: t.name,
      description: t.description ?? "",
      priceMonthly: t.priceMonthly,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      isFeatured: t.isFeatured,
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        Тарифы
      </h1>
      {msg && <p className="text-sm text-accent">{msg}</p>}

      <form onSubmit={save} className="grid max-w-xl gap-3 rounded-[14px] border border-white/6 bg-surface p-6">
        <h2 className="font-semibold">{editId ? "Редактировать" : "Новый тариф"}</h2>
        <input
          placeholder="slug (start)"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
          required
        />
        <input
          placeholder="Название"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
          required
        />
        <textarea
          placeholder="Описание"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <input
          type="number"
          placeholder="Цена в копейках"
          value={form.priceMonthly}
          onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })}
          className="rounded-[10px] border border-white/10 bg-elevated px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Активен
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
          />
          Рекомендуемый
        </label>
        <button type="submit" className="rounded-[10px] bg-accent py-2 text-[#042f2e]">
          Сохранить
        </button>
      </form>

      <div className="overflow-x-auto rounded-[14px] border border-white/6">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-text-muted">
            <tr>
              <th className="p-3">Slug</th>
              <th className="p-3">Название</th>
              <th className="p-3">Цена ₽</th>
              <th className="p-3">Статус</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-white/6">
                <td className="p-3">{t.slug}</td>
                <td className="p-3">{t.name}</td>
                <td className="p-3">{(t.priceMonthly / 100).toLocaleString("ru-RU")}</td>
                <td className="p-3">{t.isActive ? "активен" : "выкл"}</td>
                <td className="p-3 space-x-2">
                  <button type="button" onClick={() => startEdit(t)} className="text-accent">
                    Изм.
                  </button>
                  <button type="button" onClick={() => remove(t.id)} className="text-red-400">
                    Удал.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
