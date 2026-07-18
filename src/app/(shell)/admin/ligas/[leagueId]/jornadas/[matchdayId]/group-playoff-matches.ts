/**
 * group-playoff-matches.ts
 *
 * Agrupa los partidos de una jornada de playoff por (zona, ronda) para que
 * la pantalla de captura no los mezcle en una sola tabla plana — todos los
 * partidos de TODAS las rondas de una liga (cuartos, semis, final, de
 * cualquier zona) cuelgan del mismo matchday sentinel (ver
 * entities/match/queries.ts:getPlayoffSlotInfoForMatches). Pura — sin acceso
 * a DB, fácil de testear con datos en memoria.
 */
import type { PlayoffMatchRoundInfo } from "@/entities/match/queries";
import { playoffRoundLabel } from "./playoff-round-label";

export type PlayoffMatchGroup<T> = { label: string; matches: T[] };

type Bucket<T> = {
	sortZone: string;
	sortRound: number;
	sortThird: number;
	label: string;
	matches: T[];
};

export function groupPlayoffMatches<T extends { id: string }>(
	matches: T[],
	infoByMatchId: Map<string, PlayoffMatchRoundInfo>,
): PlayoffMatchGroup<T>[] {
	// Con más de una zona activa (Liguilla + Copa + Recopa) el label lleva
	// prefijo de zona; con una sola, el nombre de zona es redundante.
	const zoneNames = new Set([...infoByMatchId.values()].map((i) => i.zoneName));
	const multiZone = zoneNames.size > 1;

	const buckets = new Map<string, Bucket<T>>();

	for (const m of matches) {
		const info = infoByMatchId.get(m.id);
		const zoneName = info?.zoneName ?? "";
		const round = info?.round ?? 0;
		const isThirdPlace = info?.isThirdPlace ?? false;
		const roundLabel = info
			? playoffRoundLabel(info.round, info.maxRound, info.isThirdPlace)
			: "Fase Final";
		const label = multiZone && zoneName ? `${zoneName} — ${roundLabel}` : roundLabel;
		const key = `${zoneName}::${round}::${isThirdPlace ? 1 : 0}`;

		const bucket = buckets.get(key);
		if (bucket) {
			bucket.matches.push(m);
		} else {
			buckets.set(key, {
				sortZone: zoneName,
				sortRound: round,
				sortThird: isThirdPlace ? 1 : 0,
				label,
				matches: [m],
			});
		}
	}

	return [...buckets.values()]
		.sort((a, b) => {
			if (a.sortZone !== b.sortZone) return a.sortZone.localeCompare(b.sortZone);
			if (a.sortRound !== b.sortRound) return a.sortRound - b.sortRound;
			return a.sortThird - b.sortThird;
		})
		.map(({ label, matches }) => ({ label, matches }));
}
