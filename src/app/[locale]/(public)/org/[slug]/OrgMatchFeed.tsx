/**
 * OrgMatchFeed.tsx — lista compacta de partidos del home del subdominio.
 * Dos variantes: "upcoming" (hora + liga · cancha) y "recent" (liga + marcador).
 * Presentacional/server-safe.
 *
 * NOTA (V1): la hora se formatea en zona horaria de Tijuana — la org guarda
 * ciudad pero aún no timezone propio. Cuando exista `organization.timezone`,
 * pasarlo como prop y reemplazar la constante. Ver docs/SUBDOMINIOS-MULTITENANT.md.
 */

import { Clock } from "lucide-react";
import type { OrgFeedMatch } from "@/entities/organization";

const ORG_TIME_ZONE = "America/Tijuana";
const timeFmt = new Intl.DateTimeFormat("es-MX", {
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
	timeZone: ORG_TIME_ZONE,
});

function formatTime(iso: string | null): string | null {
	if (!iso) return null;
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? null : timeFmt.format(d);
}

type Props = {
	variant: "upcoming" | "recent";
	matches: OrgFeedMatch[];
	vsWord: string;
	emptyLabel: string;
};

export default function OrgMatchFeed({ variant, matches, vsWord, emptyLabel }: Props) {
	if (matches.length === 0) {
		return (
			<div className="bg-surface border border-line rounded-xl px-4 py-8 text-center text-[13px] text-ink-3">
				{emptyLabel}
			</div>
		);
	}

	return (
		<div className="bg-surface border border-line rounded-xl overflow-hidden">
			{matches.map((m, i) => {
				const time = formatTime(m.kickoffAt);
				return (
					<div
						key={m.matchId}
						className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] ${
							i < matches.length - 1 ? "border-b border-line" : ""
						}`}
					>
						{variant === "upcoming" && (
							<span className="flex items-center gap-1 w-11 shrink-0 text-[12px] text-ink-3 font-mono">
								<Clock size={11} strokeWidth={1.75} />
								{time ?? "—"}
							</span>
						)}

						<div className="flex-1 min-w-0">
							<div className="text-[13.5px] font-semibold text-ink truncate">
								{m.homeTeamName} <span className="text-ink-3 font-normal">{vsWord}</span>{" "}
								{m.awayTeamName}
							</div>
							<div className="text-[11.5px] text-ink-3 truncate">
								{variant === "upcoming" && m.venueName
									? `${m.leagueName} · ${m.venueName}`
									: m.leagueName}
							</div>
						</div>

						{variant === "recent" && (
							<span className="shrink-0 font-display font-black text-base text-ink tabular-nums">
								{m.homeScore} — {m.awayScore}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}
