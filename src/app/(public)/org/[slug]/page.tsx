import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  getPublicOrganization,
  getLeagueSnapshot,
  getOrgHubStats,
} from "@/entities/organization";
import {
  buildLeagueStories,
  buildTickerItems,
  buildNarrativeLine,
} from "@/features/org-hub";
import OrgHeroHeader       from "./OrgHeroHeader";
import OrgStatsStrip       from "./OrgStatsStrip";
import OrgTicker           from "./OrgTicker";
import LeagueStoryCarousel from "./LeagueStoryCarousel";
import LeagueNarrativeCard from "./LeagueNarrativeCard";
import ShareButton         from "@/shared/ui/ShareButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const org = await getPublicOrganization(slug);
  if (!org) return { title: "Organización no encontrada" };

  const totalTeams = org.leagues.reduce((acc, l) => acc + l.teams.length, 0);
  const description = `Hub de ${org.name} en TalachaStats. ${org.leagues.length} liga${org.leagues.length !== 1 ? "s" : ""} activa${org.leagues.length !== 1 ? "s" : ""} en ${org.city}.`;

  const ogParams = new URLSearchParams({
    title: org.name,
    sub:   `${org.city} · ${org.leagues.length} liga${org.leagues.length !== 1 ? "s" : ""}`,
    s1l:   "Ligas",   s1v: String(org.leagues.length),
    s2l:   "Equipos", s2v: String(totalTeams),
  });
  const ogImageUrl = `/api/og?${ogParams.toString()}`;

  return {
    title: `${org.name} — TalachaStats`,
    description,
    openGraph: {
      title:       `${org.name} — TalachaStats`,
      description,
      images:      [{ url: ogImageUrl, width: 1200, height: 630, alt: org.name }],
      type:        "website",
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${org.name} — TalachaStats`,
      description,
      images:      [ogImageUrl],
    },
  };
}

export default async function OrgPublicPage({ params }: Props) {
  const { slug } = await params;
  const org = await getPublicOrganization(slug);
  if (!org) notFound();

  const totalTeams = org.leagues.reduce((acc, l) => acc + l.teams.length, 0);

  const [hubStats, snapshots] = await Promise.all([
    getOrgHubStats(org.id),
    Promise.all(org.leagues.map((l) => getLeagueSnapshot(l.id))),
  ]);

  // Transformaciones de datos — toda la lógica de negocio en features/
  const tickerItems = buildTickerItems(org.leagues, snapshots);
  const leagueData = org.leagues.map((league, i) => ({
    league,
    snapshot: snapshots[i],
    stories:   buildLeagueStories(league, snapshots[i], hubStats.totalGoals),
    narrative: buildNarrativeLine(league, snapshots[i]),
  }));

  return (
    <div className="text-ink flex flex-col flex-1 bg-pitch">

      {/* ── Header — info de org + grid de stats ── */}
      <header className="relative px-5 pt-8 pb-5 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 40%, rgba(0,230,118,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-5">
            <Link
              href="/ligas"
              className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Ligas
            </Link>
            <ShareButton title={org.name} variant="icon" />
          </div>

          <OrgHeroHeader
            name={org.name}
            city={org.city}
            logoUrl={org.logoUrl ?? null}
            totalLeagues={org.leagues.length}
            totalTeams={totalTeams}
          />

          {/* Grid de 3 stats — llena el header, elimina el vacío */}
          <OrgStatsStrip stats={hubStats} totalTeams={totalTeams} />
        </div>
      </header>

      {/* ── Ticker B ── */}
      {tickerItems.length > 0 && <OrgTicker items={tickerItems} />}

      {/* ── Ligas: carrusel A + narrativa D — sin corte visual ── */}
      <div className="flex-1 bg-surface px-4 pt-5 pb-16">
        <div className="max-w-lg mx-auto space-y-8">

          {org.leagues.length === 0 ? (
            <p className="text-sm text-ink-3 text-center py-10">
              No hay ligas activas en este momento.
            </p>
          ) : (
            leagueData.map(({ league, snapshot, stories, narrative }) => (
              <section key={league.id} className="space-y-3">
                <h2 className="text-[10px] font-bold text-ink-3 uppercase tracking-widest px-0.5">
                  {league.name}
                </h2>

                {/* A — carrusel rotante */}
                <LeagueStoryCarousel stories={stories} />

                {/* D — narrativa + stats + link */}
                <LeagueNarrativeCard
                  league={league}
                  snapshot={snapshot}
                  narrative={narrative}
                  orgSlug={org.slug}
                />
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
