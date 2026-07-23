/**
 * OrgLeagueCard.tsx — tarjeta de una liga en el home del subdominio.
 * Enlaza a la página pública de la liga (`/{slug}`, relativa dentro del
 * subdominio — proxy.ts antepone /org/{orgSlug}). El punto de color diferencia
 * ligas visualmente; es decorativo (no sale del tema).
 */

import { ChevronRight } from "lucide-react";
import { Link } from "@/shared/i18n/navigation";

type Props = {
	slug: string;
	name: string;
	season: string;
	teamsCount: number;
	jornada: number | null;
	dotColor: string;
	inCourseLabel: string;
	viewLabel: string;
	teamsWord: string;
	matchdayWord: string;
};

export default function OrgLeagueCard({
	slug,
	name,
	season,
	teamsCount,
	jornada,
	dotColor,
	inCourseLabel,
	viewLabel,
	teamsWord,
	matchdayWord,
}: Props) {
	const meta = [
		season,
		`${teamsCount} ${teamsWord}`,
		jornada != null ? `${matchdayWord} ${jornada}` : null,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<Link
			href={`/${slug}`}
			className="group flex flex-col gap-3 bg-surface border border-line rounded-xl px-5 py-4 transition-[border-color,transform] hover:border-line-2 hover:-translate-y-px"
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<span
						className="w-2 h-2 rounded-full shrink-0"
						style={{ background: dotColor }}
						aria-hidden
					/>
					<span className="font-display font-bold text-[15px] text-ink tracking-tight truncate">
						{name}
					</span>
				</div>
				<span className="shrink-0 text-[10.5px] font-bold uppercase tracking-wide text-brand-ink bg-brand/10 border border-brand/25 rounded-full px-2.5 py-0.5">
					{inCourseLabel}
				</span>
			</div>

			<div className="text-[12.5px] text-ink-3">{meta}</div>

			<div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2 group-hover:text-ink transition-colors">
				{viewLabel}
				<ChevronRight size={13} strokeWidth={2} />
			</div>
		</Link>
	);
}
