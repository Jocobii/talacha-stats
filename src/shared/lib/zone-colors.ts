/**
 * shared/lib/zone-colors.ts
 *
 * Mapa de clases Tailwind para las zonas de clasificación.
 * Se mantienen como strings literales completos para que Tailwind no las purgue.
 */

export type ZoneColor = "green" | "blue" | "amber" | "rose" | "purple" | "orange" | "cyan";

export type ZoneColorTokens = {
	leftBorder: string; // border-l-4 color
	rowBg: string; // fondo suave de la fila
	badgeBg: string; // fondo del badge de zona
	badgeText: string; // texto del badge
	badgeBorder: string; // borde del badge
	dot: string; // punto de color en la config
};

export const ZONE_COLOR_MAP: Record<string, ZoneColorTokens> = {
	green: {
		leftBorder: "border-l-emerald-500",
		rowBg: "bg-emerald-500/5",
		badgeBg: "bg-emerald-500/15",
		badgeText: "text-emerald-700",
		badgeBorder: "border-emerald-500/25",
		dot: "bg-emerald-500",
	},
	blue: {
		leftBorder: "border-l-blue-500",
		rowBg: "bg-blue-500/5",
		badgeBg: "bg-blue-500/15",
		badgeText: "text-blue-700",
		badgeBorder: "border-blue-500/25",
		dot: "bg-blue-500",
	},
	amber: {
		leftBorder: "border-l-amber-500",
		rowBg: "bg-amber-500/5",
		badgeBg: "bg-amber-500/15",
		badgeText: "text-amber-700",
		badgeBorder: "border-amber-500/25",
		dot: "bg-amber-500",
	},
	rose: {
		leftBorder: "border-l-rose-500",
		rowBg: "bg-rose-500/5",
		badgeBg: "bg-rose-500/15",
		badgeText: "text-rose-700",
		badgeBorder: "border-rose-500/25",
		dot: "bg-rose-500",
	},
	purple: {
		leftBorder: "border-l-purple-500",
		rowBg: "bg-purple-500/5",
		badgeBg: "bg-purple-500/15",
		badgeText: "text-purple-700",
		badgeBorder: "border-purple-500/25",
		dot: "bg-purple-500",
	},
	orange: {
		leftBorder: "border-l-orange-500",
		rowBg: "bg-orange-500/5",
		badgeBg: "bg-orange-500/15",
		badgeText: "text-orange-700",
		badgeBorder: "border-orange-500/25",
		dot: "bg-orange-500",
	},
	cyan: {
		leftBorder: "border-l-cyan-500",
		rowBg: "bg-cyan-500/5",
		badgeBg: "bg-cyan-500/15",
		badgeText: "text-cyan-700",
		badgeBorder: "border-cyan-500/25",
		dot: "bg-cyan-500",
	},
};

export function getZoneTokens(color: string): ZoneColorTokens {
	return ZONE_COLOR_MAP[color] ?? ZONE_COLOR_MAP.green;
}

export type ZoneInfo = {
	id: string;
	name: string;
	fromPosition: number;
	toPosition: number;
	color: string;
};

/** Finds the zone that contains `position` (1-based), or null if none. */
export function findZone(zones: ZoneInfo[], position: number): ZoneInfo | null {
	return zones.find((z) => position >= z.fromPosition && position <= z.toPosition) ?? null;
}

/** True if `position` is the first row of its zone. */
export function isZoneStart(zone: ZoneInfo | null, position: number): boolean {
	return zone !== null && position === zone.fromPosition;
}
