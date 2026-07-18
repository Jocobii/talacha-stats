"use client";

/**
 * app/(public)/org/[slug]/[leagueSlug]/LeaguePublicTabs.tsx
 *
 * Tabs: Tabla | Goleadores | Jornada | Fase Final | Sancionados.
 */

import { useState } from "react";
import { Trophy, Target, CalendarDays, Swords, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicMatchday } from "@/entities/organization";
import MatchdayPublicView from "./MatchdayPublicView";
import { PublicBracketView } from "./PublicBracketView";
import type { PublicBracket } from "./PublicBracketView";

type Tab = "tabla" | "goleadores" | "jornada" | "playoffs" | "sancionados";

type Props = {
	schedulingEnabled: boolean;
	matchdays: PublicMatchday[];
	standingsSection: React.ReactNode;
	scorersSection: React.ReactNode;
	brackets: PublicBracket[];
	suspensionsSection: React.ReactNode;
	hasSuspensions: boolean;
	/**
	 * Tab con la que se debe abrir esta vista. La paginación/búsqueda de
	 * goleadores navega con `?tab=goleadores&page=N&q=...` (Links/router,
	 * SSR) — sin esto, cada click en "siguiente página" recargaría la
	 * pantalla de vuelta al tab "Tabla".
	 */
	initialTab?: Tab;
};

export default function LeaguePublicTabs({
	schedulingEnabled,
	matchdays,
	standingsSection,
	scorersSection,
	brackets,
	suspensionsSection,
	hasSuspensions,
	initialTab = "tabla",
}: Props) {
	const t = useTranslations("org");
	const showJornada = schedulingEnabled && matchdays.length > 0;
	const showPlayoffs = brackets.length > 0;
	const [activeTab, setActiveTab] = useState<Tab>(initialTab);

	const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
		{ id: "tabla", label: t("league.tabs.standings"), icon: <Trophy size={14} strokeWidth={2} /> },
		{
			id: "goleadores",
			label: t("league.tabs.scorers"),
			icon: <Target size={14} strokeWidth={2} />,
		},
		...(showJornada
			? [
					{
						id: "jornada" as Tab,
						label: t("league.tabs.matchday"),
						icon: <CalendarDays size={14} strokeWidth={2} />,
					},
				]
			: []),
		...(showPlayoffs
			? [
					{
						id: "playoffs" as Tab,
						label: t("league.tabs.playoffs"),
						icon: <Swords size={14} strokeWidth={2} />,
					},
				]
			: []),
		...(hasSuspensions
			? [
					{
						id: "sancionados" as Tab,
						label: t("league.tabs.suspended"),
						icon: <ShieldAlert size={14} strokeWidth={2} />,
					},
				]
			: []),
	];

	return (
		<div className="flex flex-col gap-5">
			{/* Tab bar — ancho natural (shrink-0) + scroll horizontal en vez de
			    flex-1 a partes iguales: con 5 tabs, forzar el mismo ancho hacía
			    que "Fase Final"/"Sancionados" envolvieran texto y se viera
			    apretado en mobile. */}
			<div className="flex gap-1 bg-surface-2 p-1 rounded-xl border border-line overflow-x-auto scrollbar-hide">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors ${
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
			{activeTab === "sancionados" && hasSuspensions && suspensionsSection}
		</div>
	);
}
