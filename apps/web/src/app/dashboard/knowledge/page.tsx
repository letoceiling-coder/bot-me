"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import type { KnowledgeBaseDto, KnowledgeDocumentDto } from "@botme/shared";

export default function KnowledgePage() {
  const [bases, setBases] = useState<KnowledgeBaseDto[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocumentDto[]>([]);
  const [newBaseName, setNewBaseName] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function loadBases() {
    const data = await apiFetch<KnowledgeBaseDto[]>("/knowledge/bases");
    setBases(data);
    if (!selectedBaseId && data[0]) setSelectedBaseId(data[0].id);
  }

  async function loadDocuments(baseId: string) {
    const docs = await apiFetch<KnowledgeDocumentDto[]>(
      `/knowledge/bases/${baseId}/documents`,
    );
    setDocuments(docs);
  }

  useEffect(() => {
    loadBases()
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBaseId) {
      loadDocuments(selectedBaseId).catch(() => setDocuments([]));
    }
  }, [selectedBaseId]);

  async function createBase(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const base = await apiFetch<KnowledgeBaseDto>("/knowledge/bases", {
      method: "POST",
      body: JSON.stringify({ name: newBaseName }),
    });
    setNewBaseName("");
    setBases((prev) => [base, ...prev]);
    setSelectedBaseId(base.id);
    setMsg("База создана");
  }

  async function pasteText(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBaseId) return;
    setError("");
    const doc = await apiFetch<KnowledgeDocumentDto>(
      `/knowledge/bases/${selectedBaseId}/documents/text`,
      {
        method: "POST",
        body: JSON.stringify({ title: pasteTitle, content: pasteContent }),
      },
    );
    setPasteTitle("");
    setPasteContent("");
    setDocuments((prev) => [doc, ...prev]);
    setMsg(doc.status === "ready" ? "Текст проиндексирован" : "Ошибка индексации");
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedBaseId) return;
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    try {
      const doc = await apiUpload<KnowledgeDocumentDto>(
        `/knowledge/bases/${selectedBaseId}/documents/upload`,
        fd,
      );
      setDocuments((prev) => [doc, ...prev]);
      setMsg(doc.status === "ready" ? "Файл загружен" : "Ошибка обработки");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    }
    e.target.value = "";
  }

  async function removeDoc(id: string) {
    if (!confirm("Удалить документ?")) return;
    await apiFetch(`/knowledge/documents/${id}`, { method: "DELETE" });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  if (loading) return <p className="text-text-muted">Загрузка…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          База знаний
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Загрузите прайс, FAQ и инструкции — ассистент будет отвечать по ним
        </p>
      </div>

      {error && (
        <p className="rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
      {msg && (
        <p className="rounded-[10px] bg-accent/10 px-3 py-2 text-sm text-accent">{msg}</p>
      )}

      <section className="rounded-[14px] border border-white/6 bg-surface p-6">
        <h2 className="font-semibold">Базы знаний</h2>
        <form onSubmit={createBase} className="mt-3 flex flex-wrap gap-2">
          <input
            value={newBaseName}
            onChange={(e) => setNewBaseName(e.target.value)}
            placeholder="Название базы"
            className="flex-1 rounded-[10px] border border-white/10 bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
            required
          />
          <button
            type="submit"
            className="rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-[#042f2e]"
          >
            Создать
          </button>
        </form>
        {bases.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {bases.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBaseId(b.id)}
                className={`rounded-full px-3 py-1 text-sm ${
                  selectedBaseId === b.id
                    ? "bg-accent/20 text-accent"
                    : "bg-white/5 text-text-secondary hover:bg-white/10"
                }`}
              >
                {b.name} ({b.documentCount})
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedBaseId && (
        <>
          <section className="rounded-[14px] border border-white/6 bg-surface p-6 space-y-4">
            <h2 className="font-semibold">Добавить материал</h2>
            <div>
              <label className="text-sm text-text-muted">Загрузить .txt</label>
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={uploadFile}
                className="mt-1 block w-full text-sm text-text-secondary"
              />
            </div>
            <form onSubmit={pasteText} className="space-y-3">
              <input
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Заголовок"
                className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
                required
              />
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Вставьте текст прайса, FAQ или инструкции…"
                rows={6}
                className="w-full rounded-[10px] border border-white/10 bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
                required
              />
              <button
                type="submit"
                className="rounded-[10px] border border-white/10 px-4 py-2 text-sm hover:border-accent/40"
              >
                Сохранить текст
              </button>
            </form>
          </section>

          <section className="rounded-[14px] border border-white/6 bg-surface p-6">
            <h2 className="mb-4 font-semibold">Документы</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-text-muted">Пока нет документов</p>
            ) : (
              <ul className="space-y-3">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-[10px] border border-white/6 p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{d.title}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {d.sourceType} · {d.chunkCount} фрагментов ·{" "}
                        <StatusBadge status={d.status} />
                      </p>
                      {d.errorMessage && (
                        <p className="mt-1 text-xs text-red-400">{d.errorMessage}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDoc(d.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") return <span className="text-accent">готово</span>;
  if (status === "failed") return <span className="text-red-400">ошибка</span>;
  if (status === "processing") return <span>обработка…</span>;
  return <span>{status}</span>;
}
