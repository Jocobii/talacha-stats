import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  getPublicOrganization,
  getLeagueSnapshot,
  getOrgHubStats,
} from "@/entities/organization";
import OrgHeroHeader from "./OrgHeroHeader";
import OrgStatsStrip from "./OrgStatsStrip";
import LeagueSnapshotCard from "./LeagueSnapshotCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const org = await getPublicOrganization(slug);
  if (!org) return { title: "Organización no encontrada" };
  return {
    title: `${org.name} — TalachaStats`,
    description: `Hub de ${org.name} en TalachaStats. ${org.leagues.length} liga${org.leagues.length !== 1 ? "s" : ""} activa${org.leagues.length !== 1 ? "s" : ""} en ${org.city}.`,
  };
}

export default async function OrgPublicPage({ params }: Props) {
  const { slug } = await params;
  const org = await getPublicOrganization(slug);
  if (!org) notFound();

  const totalTeams = org.leagues.reduce((acc, l) => acc + l.teams.length, 0);

  // Fetch paralelo: stats del hub + snapshot de cada liga
  const [hubStats, snapshots] = await Promise.all([
    getOrgHubStats(org.id),
    Promise.all(org.leagues.map((l) => getLeagueSnapshot(l.id))),
  ]);

  return (
    <div className="text-ink flex flex-col flex-1 bg-pitch">

      {/* ── Header con glow de fondo ── */}
      <header className="relative px-5 pt-8 pb-0 max-w-lg mx-auto w-full overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 80% 40%, rgba(0,230,118,0.07) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 pb-6">
          <Link
            href="/ligas"
            className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Ligas
          </Link>

          <OrgHeroHeader
            name={org.name}
            city={org.city}
            logoUrl={org.logoUrl ?? null}
            totalLeagues={org.leagues.length}
            totalTeams={totalTeams}
          />

          <OrgStatsStrip stats={hubStats} totalTeams={totalTeams} />
        </div>
      </header>

      {/* ── Ligas ── */}
      <div className="flex-1 bg-surface rounded-t-3xl px-4 pt-5 pb-16">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xs font-bold text-ink-3 uppercase tracking-widest mb-3">
            Ligas activas
          </h2>

          {org.leagues.length === 0 ? (
            <p className="text-sm text-ink-3 text-center py-10">
              No hay ligas activas en este momento.
            </p>
          ) : (
            <div className="space-y-2">
              {org.leagues.map((league, i) => (
                <LeagueSnapshotCard
                  key={league.id}
                  league={league}
                  snapshot={snapshots[i]}
                  orgSlug={org.slug}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
