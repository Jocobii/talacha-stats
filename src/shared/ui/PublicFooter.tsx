import { getVisitStats } from "@/entities/analytics/queries";

export default async function PublicFooter() {
  const { totalUniqueVisitors } = await getVisitStats().catch(() => ({
    totalUniqueVisitors: 0,
  }));

  return (
    <footer className="bg-pitch border-t border-line px-5 py-5">
      <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-ink-3 font-display uppercase tracking-widest text-center sm:text-left">
        <p>TalachaStats</p>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <p>App en demo — seguimos agregando ligas</p>
          <p>👁 {totalUniqueVisitors.toLocaleString("es-MX")} visitantes únicos</p>
        </div>
      </div>
    </footer>
  );
}
