"use client";

/**
 * PreviewMatchdayList — Lista acordeón de jornadas del preview del sorteo.
 * Sub-componente atómico de SorteoWizard.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Pairing = {
	matchdayNumber: number;
	homeTeamId: string;
	awayTeamId: string | null | undefined;
};

type Matchday = { number: number; pairings: Pairing[] };

type Props = {
	matchdays: Matchday[];
	teamCount: number;
	seed: number;
	teamName: (id: string) => string;
	initialExpanded?: number;
};

export function PreviewMatchdayList({
	matchdays,
	teamCount,
	seed,
	teamName,
	initialExpanded,
}: Props) {
	const [expandedMatchday, setExpandedMatchday] = useState<number | null>(initialExpanded ?? null);

	return (
		<div className="bg-surface rounded-lg shadow">
			<div className="px-5 py-4 border-b border-line">
				<h2 className="font-semibold text-ink">
					Preview — {matchdays.length} jornada{matchdays.length !== 1 ? "s" : ""}
				</h2>
				<p className="text-xs text-ink-2 mt-0.5">
					{teamCount} equipos · seed {seed}
				</p>
			</div>
			<div className="divide-y divide-line">
				{matchdays.map((md) => {
					const open = expandedMatchday === md.number;
					const realMatches = md.pairings.filter((p) => p.awayTeamId !== null);
					const hasBye = md.pairings.some((p) => p.awayTeamId === null);
					return (
						<div key={md.number}>
							<button
								onClick={() => setExpandedMatchday(open ? null : md.number)}
								className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-2 text-left"
							>
								<div className="flex items-center gap-3">
									<span className="font-medium text-ink text-sm">Jornada {md.number}</span>
									<span className="text-xs text-ink-3">
										{realMatches.length} partido{realMatches.length !== 1 ? "s" : ""}
										{hasBye && " · 1 BYE"}
									</span>
								</div>
								{open ? (
									<ChevronUp size={15} className="text-ink-2" />
								) : (
									<ChevronDown size={15} className="text-ink-2" />
								)}
							</button>
							{open && (
								<div className="px-5 pb-3 space-y-1.5 bg-surface-2/30">
									{md.pairings.map((p, i) => {
										if (p.awayTeamId == null) {
											return (
												<div key={i} className="flex items-center gap-2 text-sm text-ink-3 py-1">
													<span className="font-mono text-xs bg-surface px-2 py-0.5 rounded">
														BYE
													</span>
													<span className="truncate">{teamName(p.homeTeamId)}</span>
												</div>
											);
										}
										return (
											<div
												key={i}
												className="flex items-center justify-between bg-surface rounded px-3 py-2 text-sm"
											>
												<span className="font-medium text-ink w-36 text-right truncate">
													{teamName(p.homeTeamId)}
												</span>
												<span className="text-xs text-ink-3 mx-3 shrink-0">vs</span>
												<span className="font-medium text-ink w-36 truncate">
													{teamName(p.awayTeamId)}
												</span>
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
