/**
 * app/(public)/org/[slug]/[leagueSlug]/SuspendedList.tsx
 *
 * Lista pública de sancionados vigentes — solo lectura, sin acciones de
 * administración (eso vive en features/discipline/ui, admin-only). Usa el
 * mismo lenguaje visual que ScorersSection/MatchdayPublicView (bg-surface-2,
 * border-line, acentos brand) en vez del design system oscuro de admin.
 */

import { Ban } from "lucide-react";
import { titleCase } from "@/shared/lib/normalize";
import {
	fmtIsoDate,
	initialsFromName,
	weeksLeft,
} from "@/features/discipline/lib/format-suspension";
import type { PublicSuspensionListItem } from "@/entities/suspension/queries";

type Props = { suspensions: PublicSuspensionListItem[] };

function reasonLabel(s: PublicSuspensionListItem): string {
	if (s.reason === "red_card") return "Roja directa";
	if (s.reason === "yellow_accumulation") return "Acumulación de amarillas";
	return "Sanción manual";
}

function DurationInfo({ s }: { s: PublicSuspensionListItem }) {
	if (s.durationType === "permanent") {
		return (
			<span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-rose">
				<Ban size={12} strokeWidth={2.25} />
				Indefinida
			</span>
		);
	}
	if (s.durationType === "time" && s.endsOn) {
		const weeks = weeksLeft(s.endsOn);
		return (
			<span className="text-right block">
				<span className="block text-[12px] font-semibold text-amber">
					Hasta {fmtIsoDate(s.endsOn)}
				</span>
				<span className="block text-[10px] text-ink-3 mt-0.5">
					faltan {weeks} semana{weeks !== 1 ? "s" : ""}
				</span>
			</span>
		);
	}
	const total = s.matchesTotal ?? 0;
	const remaining = Math.max(total - s.matchesServed, 0);
	return (
		<span className="text-right block">
			<span className="block text-[12px] font-semibold text-brand-ink">
				{remaining} partido{remaining !== 1 ? "s" : ""}
			</span>
			<span className="block text-[10px] text-ink-3 mt-0.5">
				{s.matchesServed} de {total} cumplida{s.matchesServed !== 1 ? "s" : ""}
			</span>
		</span>
	);
}

function SuspendedRow({ s }: { s: PublicSuspensionListItem }) {
	return (
		<div className="flex items-center gap-3 bg-surface-2 border border-line rounded-2xl px-4 py-3">
			<div className="w-9 h-9 rounded-full bg-rose/10 border border-rose/20 flex items-center justify-center text-rose font-display font-black text-sm shrink-0">
				{initialsFromName(s.playerName)}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-sm text-ink truncate">{titleCase(s.playerName)}</p>
				<div className="flex items-center gap-1.5 mt-0.5">
					<span className="text-xs text-ink-3 truncate">{titleCase(s.teamName)}</span>
					<span className="text-[10px] text-ink-3 shrink-0">· {reasonLabel(s)}</span>
				</div>
			</div>
			<DurationInfo s={s} />
		</div>
	);
}

/** El estado vacío lo maneja page.tsx (mismo patrón que standings/scorers). */
export default function SuspendedList({ suspensions }: Props) {
	return (
		<div className="space-y-1.5">
			{suspensions.map((s) => (
				<SuspendedRow key={s.id} s={s} />
			))}
		</div>
	);
}
