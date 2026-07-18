"use client";

import { Eye, Send, Check } from "lucide-react";
import Link from "next/link";
import { Inline, Center } from "@/shared/ui/layout";
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
	const stepDone = hasMatches;
	return (
		<Inline
			as="footer"
			align="center"
			gap="md"
			className="z-10 shrink-0 px-5 py-3.5"
			style={{
				borderTop: "1px solid var(--color-line)",
				background: "color-mix(in srgb, var(--color-surface) 95%, transparent)",
				backdropFilter: "blur(6px)",
			}}
		>
			<Inline align="center" gap="sm" className="flex-1" style={{ fontSize: 13 }}>
				<Center
					as="span"
					className="h-[22px] w-[22px] rounded-md"
					style={{
						background: stepDone ? "var(--color-brand)" : "var(--tint-brand)",
						color: stepDone ? "var(--color-pitch)" : "var(--color-brand-ink)",
						fontWeight: 700,
						fontSize: 11,
					}}
				>
					{stepDone ? <Check size={12} strokeWidth={3} /> : 3}
				</Center>
				<span style={{ color: "var(--color-ink-2)" }}>Próximo paso —</span>
				<span style={{ color: "var(--color-ink)", fontWeight: 600 }}>{NEXT_STEP_TEXT[key]}</span>
			</Inline>
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
		</Inline>
	);
}
