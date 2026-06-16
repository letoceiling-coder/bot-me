"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { NotificationsSummaryDto } from "@botme/shared";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsSummaryDto | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      setData(await apiFetch<NotificationsSummaryDto>("/notifications"));
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markRead(id: string) {
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
    load();
  }

  async function markAllRead() {
    await apiFetch("/notifications/read-all", { method: "POST" });
    load();
  }

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-[10px] border border-white/10 px-2.5 py-1.5 text-sm hover:border-accent/40"
        aria-label="Уведомления"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#042f2e]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-[12px] border border-white/10 bg-elevated shadow-xl">
          <div className="flex items-center justify-between border-b border-white/6 px-3 py-2">
            <span className="text-sm font-medium">Уведомления</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-accent hover:underline"
              >
                Прочитать все
              </button>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {!data?.items.length ? (
              <li className="px-3 py-6 text-center text-sm text-text-muted">
                Нет уведомлений
              </li>
            ) : (
              data.items.map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-white/6 px-3 py-2.5 text-sm ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">
                      {new Date(n.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
