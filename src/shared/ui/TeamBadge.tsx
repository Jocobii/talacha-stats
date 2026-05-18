"use client";

type TeamBadgeSize = "sm" | "md" | "lg";

type TeamBadgeProps = {
	teamId: string;
	name: string;
	color: string | null;
	short?: string | null;
	showName?: boolean;
	size?: TeamBadgeSize;
};

const SIZE_MAP: Record<TeamBadgeSize, { box: number; font: number; radius: number }> = {
	sm: { box: 20, font: 9, radius: 6 },
	md: { box: 26, font: 11, radius: 6 },
	lg: { box: 32, font: 13, radius: 8 },
};

function getInitials(name: string, short: string | null | undefined): string {
	if (short) return short.toUpperCase();
	return name.slice(0, 2).toUpperCase();
}

export function TeamBadge({
	teamId: _teamId,
	name,
	color,
	short,
	showName = false,
	size = "md",
}: TeamBadgeProps) {
	const { box, font, radius } = SIZE_MAP[size];
	const bg = color ?? "#1E1E1E";
	const initials = getInitials(name, short);

	const badge = (
		<div
			style={{
				width: box,
				height: box,
				minWidth: box,
				borderRadius: radius,
				background: bg,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "'Barlow Condensed', sans-serif",
				fontWeight: 800,
				fontSize: font,
				color: "#fff",
				textShadow: "0 1px 2px rgba(0,0,0,0.5)",
				flexShrink: 0,
			}}
		>
			{initials}
		</div>
	);

	if (!showName) return badge;

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
			{badge}
			<span
				style={{
					fontSize: 14,
					fontWeight: 500,
					color: "var(--color-ink)",
					whiteSpace: "nowrap",
				}}
			>
				{name}
			</span>
		</div>
	);
}
