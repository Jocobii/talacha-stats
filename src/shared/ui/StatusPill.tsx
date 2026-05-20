"use client";

import { Lock } from "lucide-react";

type PillStatus = "draft" | "published" | "in_progress" | "completed";
type PillSize = "sm" | "md";

type StatusPillProps = {
	status: PillStatus;
	size?: PillSize;
};

type PillConfig = {
	label: string;
	bg: string;
	color: string;
	borderColor: string;
	dot?: "brand" | "amber";
	icon?: "lock";
};

const PILL_CONFIG: Record<PillStatus, PillConfig> = {
	draft: {
		label: "Borrador",
		bg: "rgba(255,255,255,0.06)",
		color: "var(--color-ink-2)",
		borderColor: "rgba(255,255,255,0.12)",
	},
	published: {
		label: "Publicada",
		bg: "rgba(0,230,118,0.10)",
		color: "var(--color-brand)",
		borderColor: "rgba(0,230,118,0.30)",
		dot: "brand",
	},
	in_progress: {
		label: "En Juego",
		bg: "rgba(251,191,36,0.10)",
		color: "#FBBF24",
		borderColor: "rgba(251,191,36,0.30)",
		dot: "amber",
	},
	completed: {
		label: "Cerrada",
		bg: "rgba(255,255,255,0.04)",
		color: "var(--color-ink-3)",
		borderColor: "rgba(255,255,255,0.10)",
		icon: "lock",
	},
};

const SIZE_STYLES: Record<PillSize, { fontSize: number; padding: string }> = {
	sm: { fontSize: 10, padding: "2px 7px" },
	md: { fontSize: 12, padding: "4px 10px" },
};

function PulsingDot({ color }: { color: string }) {
	return (
		<span
			style={{
				display: "inline-block",
				width: 6,
				height: 6,
				borderRadius: "50%",
				background: color,
				animation: "pulse 1.8s ease-in-out infinite",
				flexShrink: 0,
			}}
		/>
	);
}

export function StatusPill({ status, size = "md" }: StatusPillProps) {
	const config = PILL_CONFIG[status];
	const { fontSize, padding } = SIZE_STYLES[size];

	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 5,
				background: config.bg,
				color: config.color,
				border: `1px solid ${config.borderColor}`,
				borderRadius: 999,
				padding,
				fontSize,
				fontWeight: 600,
				whiteSpace: "nowrap",
				lineHeight: 1,
			}}
		>
			{config.dot === "brand" && <PulsingDot color="var(--color-brand)" />}
			{config.dot === "amber" && <PulsingDot color="#FBBF24" />}
			{config.icon === "lock" && <Lock size={fontSize + 1} strokeWidth={2.5} />}
			{config.label}
		</span>
	);
}
