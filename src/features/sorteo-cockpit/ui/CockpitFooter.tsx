"use client";

import { Eye, Send } from "lucide-react";
import Link from "next/link";
import { NEXT_STEP_TEXT } from "../constants";
import type { MatchdayStatus } from "../types";

type CockpitFooterProps = {
	matchdayNumber: number | null;
	status: MatchdayStatus | null;
	hasMatches: boolean;
	onPublish: () => void;
	loading: boolean;
	leagueId: string;
};

function ctaLabel(
	status: MatchdayStatus | null,
	hasMatches: boolean,
	n: number | null,
): string | null {
	if (!status || !hasMatches || status === "completed") return null;
	if (status === "draft") return `Publicar Jornada ${n ?? ""}`;
	return "Re-publicar cambios";
}

function stepKey(status: MatchdayStatus | null, hasMatches: boolean): string {
	if (!status) return "draft_no_matches";
	if (status === "draft") return hasMatches ? "draft_with_matches" : "draft_no_matches";
	return status;
}

export function CockpitFooter({
	matchdayNumber,
	status,
	hasMatches,
	onPublish,
	loading,
	leagueId,
}: CockpitFooterProps) {
	const key = stepKey(status, hasMatches);
	const label = ctaLabel(status, hasMatches, matchdayNumber);
	return (
		<footer
			style={{
				flexShrink: 0,
				borderTop: "1px solid var(--color-line)",
				background: "rgba(10,10,10,0.95)",
				backdropFilter: "blur(6px)",
				padding: "14px 20px",
				display: "flex",
				alignItems: "center",
				gap: 12,
				zIndex: 10,
			}}
		>
			<div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
				<span
					style={{
						width: 22,
						height: 22,
						borderRadius: 6,
						display: "grid",
						placeItems: "center",
						background: "rgba(0,230,118,0.14)",
						color: "var(--color-brand)",
						fontWeight: 700,
						fontSize: 11,
					}}
				>
					3
				</span>
				<span style={{ color: "var(--color-ink-2)" }}>Próximo paso —</span>
				<span style={{ color: "var(--color-ink)", fontWeight: 600 }}>{NEXT_STEP_TEXT[key]}</span>
			</div>
			<Link
				href={`/admin/leagues/${leagueId}/calendario`}
				className="btn-ghost"
				target="_blank"
				rel="noopener noreferrer"
				title="Abrir calendario público en nueva pestaña"
			>
				<Eye size={13} /> Vista pública
			</Link>
			{label && (
				<button className="btn-primary glow-next" onClick={onPublish} disabled={loading}>
					<Send size={14} /> {label}
				</button>
			)}
		</footer>
	);
}
