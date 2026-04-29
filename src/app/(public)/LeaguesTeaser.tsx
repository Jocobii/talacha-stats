import Link from "next/link";
import { Building2, ChevronRight, MapPin } from "lucide-react";
import { listOrganizationsPublic } from "@/entities/organization";

export default async function LeaguesTeaser() {
  const orgs = await listOrganizationsPublic();
  const orgsWithLeagues = orgs.filter((o) => o.leagues.length > 0).slice(0, 3);

  if (orgsWithLeagues.length === 0) return null;

  return (
    <section className="px-5 py-6 max-w-lg mx-auto w-full">
      {/* Header de sección */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 size={18} strokeWidth={2} className="text-brand" />
          <h2 className="font-display font-black text-lg uppercase tracking-tight">
            Ligas activas
          </h2>
        </div>
        <Link
          href="/ligas"
          className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand/70 transition-colors"
        >
          Ver todas
          <ChevronRight size={14} strokeWidth={2} />
        </Link>
      </div>

      {/* Cards de orgs */}
      <div className="space-y-2">
        {orgsWithLeagues.map((org) => (
          <Link
            key={org.id}
            href={`/org/${org.slug}`}
            className="flex items-center gap-3 bg-surface border border-line rounded-2xl px-4 py-3 hover:border-brand/40 transition-colors group"
          >
            {/* Logo / inicial */}
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={org.name}
                className="w-10 h-10 rounded-xl object-cover border border-line shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                <span className="font-display font-black text-lg text-brand">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-ink group-hover:text-brand transition-colors truncate">
                {org.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} strokeWidth={2} className="text-ink-3 shrink-0" />
                <p className="text-xs text-ink-3 truncate">
                  {org.city} · {org.leagues.length} liga{org.leagues.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <ChevronRight size={14} strokeWidth={2} className="text-ink-3 group-hover:text-brand transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {orgs.filter((o) => o.leagues.length > 0).length > 3 && (
        <Link
          href="/ligas"
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-line text-xs font-semibold text-ink-3 hover:border-brand/40 hover:text-brand transition-colors"
        >
          Ver {orgs.filter((o) => o.leagues.length > 0).length - 3} más
          <ChevronRight size={12} strokeWidth={2} />
        </Link>
      )}
    </section>
  );
}
