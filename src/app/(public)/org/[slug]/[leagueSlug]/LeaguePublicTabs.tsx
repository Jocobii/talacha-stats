"use client";

/**
 * app/(public)/org/[slug]/[leagueSlug]/LeaguePublicTabs.tsx
 *
 * Tabs: Tabla | Goleadores | Jornada | Fase Final.
 */

import { useState } from "react";
import { Trophy, Target, CalendarDays, Swords } from "lucide-react";
import type { PublicMatchday } from "@/entities/organization";
import MatchdayPublicView from "./MatchdayPublicView";
import { PublicBracketView } from "./PublicBracketView";
import type { PublicBracket } from "./PublicBracketView";

type Tab = "tabla" | "goleadores" | "jornada" | "playoffs";

type Props = {
	schedulingEnabled: boolean;
	matchdays: PublicMatchday[];
	standingsSection: React.ReactNode;
	scorersSection: React.ReactNode;
	brackets: PublicBracket[];
};

export default function LeaguePublicTabs({
	schedulingEnabled,
	matchdays,
	standingsSection,
	scorersSection,
	brackets,
}: Props) {
	const showJornada = schedulingEnabled && matchdays.length > 0;
	const showPlayoffs = brackets.length > 0;
	const [activeTab, setActiveTab] = useState<Tab>("tabla");

	const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
		{ id: "tabla", label: "Tabla", icon: <Trophy size={14} strokeWidth={2} /> },
		{ id: "goleadores", label: "Goleadores", icon: <Target size={14} strokeWidth={2} /> },
		...(showJornada
			? [
					{
						id: "jornada" as Tab,
						label: "Jornada",
						icon: <CalendarDays size={14} strokeWidth={2} />,
					},
				]
			: []),
		...(showPlayoffs
			? [
					{
						id: "playoffs" as Tab,
						label: "Fase Final",
						icon: <Swords size={14} strokeWidth={2} />,
					},
				]
			: []),
	];

	return (
		<div className="flex flex-col gap-5">
			{/* Tab bar */}
			<div className="flex gap-1 bg-surface-2 p-1 rounded-xl border border-line">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
								isActive
									? "bg-surface text-ink border border-line shadow-sm"
									: "text-ink-3 hover:text-ink-2"
							}`}
						>
							{tab.icon}
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Tab content */}
			{activeTab === "tabla" && standingsSection}
			{activeTab === "goleadores" && scorersSection}
			{activeTab === "jornada" && showJornada && <MatchdayPublicView matchdays={matchdays} />}
			{activeTab === "playoffs" && showPlayoffs && <PublicBracketView brackets={brackets} />}
		</div>
	);
}
