export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-[14px] border border-white/6 bg-surface p-8 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">{title}</h1>
      <p className="mt-2 text-text-secondary">Раздел в разработке — скоро будет доступен.</p>
    </div>
  );
}
