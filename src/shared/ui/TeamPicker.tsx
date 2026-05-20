"use client";

import { useEffect, useRef, useState } from "react";
import { TeamBadge } from "./TeamBadge";

type Team = {
	id: string;
	name: string;
	color: string | null;
	short?: string | null;
};

type PairingDraft = {
	homeTeamId: string;
	awayTeamId: string | null;
};

type TeamPickerProps = {
	value: string;
	onChange: (teamId: string) => void;
	presentTeams: Team[];
	pairings: PairingDraft[];
	currentPairingIdx: number;
	recentPairKeys: Set<string>;
	opponentId: string | null;
	align?: "left" | "right";
	disabled?: boolean;
};

function buildPairKey(a: string, b: string): string {
	return [a, b].sort().join("|");
}

function isUsedElsewhere(teamId: string, pairings: PairingDraft[], currentIdx: number): boolean {
	return pairings.some((p, idx) => {
		if (idx === currentIdx) return false;
		return p.homeTeamId === teamId || p.awayTeamId === teamId;
	});
}

function hasS4Conflict(
	teamId: string,
	opponentId: string | null,
	recentPairKeys: Set<string>,
): boolean {
	if (!opponentId) return false;
	return recentPairKeys.has(buildPairKey(teamId, opponentId));
}

export function TeamPicker({
	value,
	onChange,
	presentTeams,
	pairings,
	currentPairingIdx,
	recentPairKeys,
	opponentId,
	align = "left",
	disabled = false,
}: TeamPickerProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedTeam = presentTeams.find((t) => t.id === value);

	useEffect(() => {
		if (!open) return;

		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}

		function handleEsc(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEsc);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEsc);
		};
	}, [open]);

	function handleSelect(teamId: string) {
		onChange(teamId);
		setOpen(false);
	}

	return (
		<div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
			<button
				type="button"
				disabled={disabled}
				onClick={() => !disabled && setOpen((v) => !v)}
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					background: "var(--color-surface-2)",
					border: "1px solid var(--color-line)",
					borderRadius: 8,
					padding: "6px 10px",
					cursor: disabled ? "not-allowed" : "pointer",
					opacity: disabled ? 0.5 : 1,
					minWidth: 160,
				}}
			>
				{selectedTeam ? (
					<TeamBadge
						teamId={selectedTeam.id}
						name={selectedTeam.name}
						color={selectedTeam.color}
						short={selectedTeam.short}
						showName
						size="sm"
					/>
				) : (
					<span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Seleccionar…</span>
				)}
			</button>

			{open && (
				<div
					style={{
						position: "absolute",
						top: "calc(100% + 4px)",
						...(align === "right" ? { right: 0 } : { left: 0 }),
						zIndex: 50,
						background: "var(--color-surface)",
						border: "1px solid var(--color-line)",
						borderRadius: 8,
						minWidth: 220,
						boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
						overflow: "hidden",
					}}
				>
					{presentTeams.map((team) => {
						const isCurrent = team.id === value;
						const usedElsewhere = isUsedElsewhere(team.id, pairings, currentPairingIdx);
						const s4Conflict = hasS4Conflict(team.id, opponentId, recentPairKeys);

						return (
							<button
								key={team.id}
								type="button"
								onClick={() => handleSelect(team.id)}
								style={{
									width: "100%",
									display: "flex",
									alignItems: "center",
									gap: 8,
									padding: "8px 12px",
									background: isCurrent ? "rgba(255,255,255,0.06)" : "transparent",
									border: "none",
									cursor: "pointer",
									textAlign: "left",
									transition: "background 0.1s",
								}}
								onMouseEnter={(e) => {
									if (!isCurrent) {
										(e.currentTarget as HTMLButtonElement).style.background =
											"rgba(255,255,255,0.04)";
									}
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLButtonElement).style.background = isCurrent
										? "rgba(255,255,255,0.06)"
										: "transparent";
								}}
							>
								<TeamBadge
									teamId={team.id}
									name={team.name}
									color={team.color}
									short={team.short}
									size="sm"
								/>
								<span
									style={{
										flex: 1,
										fontSize: 13,
										color: "var(--color-ink)",
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
								>
									{team.name}
								</span>
								{usedElsewhere && !isCurrent && (
									<span
										style={{
											fontSize: 10,
											fontWeight: 600,
											color: "var(--color-ink-3)",
											background: "rgba(255,255,255,0.06)",
											border: "1px solid var(--color-line)",
											borderRadius: 4,
											padding: "1px 5px",
											whiteSpace: "nowrap",
										}}
									>
										→ swap
									</span>
								)}
								{s4Conflict && (
									<span
										style={{
											fontSize: 10,
											fontWeight: 600,
											color: "#F87171",
											background: "rgba(248,113,113,0.12)",
											border: "1px solid rgba(248,113,113,0.25)",
											borderRadius: 4,
											padding: "1px 5px",
											whiteSpace: "nowrap",
										}}
									>
										S4
									</span>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
