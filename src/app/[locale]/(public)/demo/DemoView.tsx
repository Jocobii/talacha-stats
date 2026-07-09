"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
	Trophy,
	Star,
	BarChart3,
	User,
	MapPin,
	Shuffle,
	CalendarClock,
	Loader2,
} from "lucide-react";
import { RankingTab } from "./tabs/RankingTab";
import { CtaFooter } from "./ui/CtaFooter";

// ─── Lazy tabs — cada uno es su propio chunk, se descarga al abrirse ─────────

function TabFallback() {
	return (
		<div className="flex-1 flex items-center justify-center py-24 text-brand-ink">
			<Loader2 size={22} className="animate-spin" />
		</div>
	);
}

const ProfileTab = dynamic(() => import("./tabs/ProfileTab").then((m) => m.ProfileTab), {
	loading: TabFallback,
});
const MatchdayTab = dynamic(() => import("./tabs/MatchdayTab").then((m) => m.MatchdayTab), {
	loading: TabFallback,
});
const AnalysisTab = dynamic(() => import("./tabs/AnalysisTab").then((m) => m.AnalysisTab), {
	loading: TabFallback,
});
const CanchasTab = dynamic(() => import("./tabs/CanchasTab").then((m) => m.CanchasTab), {
	loading: TabFallback,
});
const SorteoTab = dynamic(() => import("./tabs/SorteoTab").then((m) => m.SorteoTab), {
	loading: TabFallback,
});
const ApartadoTab = dynamic(() => import("./tabs/ApartadoTab").then((m) => m.ApartadoTab), {
	loading: TabFallback,
});

// ─── Tipos ──────────────────────────────────────────────────────────────────

type View = "players" | "coordinators";
type PlayerTab = "ranking" | "perfil" | "matchday" | "analisis";
type CoordTab = "canchas" | "sorteo" | "apartado";

export default function DemoView({ initialView = "players" }: { initialView?: View }) {
	const t = useTranslations("demo");
	const [view, setView] = useState<View>(initialView);
	const [playerTab, setPlayerTab] = useState<PlayerTab>("ranking");
	const [coordTab, setCoordTab] = useState<CoordTab>("canchas");

	const PLAYER_TABS = [
		{ id: "ranking" as const, label: t("tabs.ranking"), icon: Trophy },
		{ id: "perfil" as const, label: t("tabs.profile"), icon: User },
		{ id: "matchday" as const, label: t("tabs.matchday"), icon: Star },
		{ id: "analisis" as const, label: t("tabs.analysis"), icon: BarChart3 },
	];

	const COORD_TABS = [
		{ id: "canchas" as const, label: t("tabs.canchas"), icon: MapPin },
		{ id: "sorteo" as const, label: t("tabs.sorteo"), icon: Shuffle },
		{ id: "apartado" as const, label: t("tabs.apartado"), icon: CalendarClock },
	];

	return (
		<div className="text-ink flex flex-col flex-1 min-h-screen">
			{/* Demo banner — franja delgada */}
			<div className="bg-brand text-pitch text-[11px] font-bold text-center py-1.5 px-4 uppercase tracking-[0.2em]">
				{t("banner")}
			</div>

			{/* Header — solo el switcher de vista (el logo y volver viven en el menú lateral) */}
			<header className="bg-pitch border-b border-line">
				<div className="max-w-4xl mx-auto px-5 py-3 flex justify-center">
					<div className="inline-flex bg-surface-2 border border-line rounded-full p-1">
						{(
							[
								{ id: "players", label: t("views.players") },
								{ id: "coordinators", label: t("views.coordinators") },
							] as const
						).map((v) => (
							<button
								key={v.id}
								onClick={() => setView(v.id)}
								className={`px-4 sm:px-6 py-1.5 rounded-full text-[13px] font-semibold transition
                ${view === v.id ? "bg-brand text-pitch shadow-sm" : "text-ink-2 hover:text-ink"}`}
							>
								{v.label}
							</button>
						))}
					</div>
				</div>
			</header>

			{/* Tabs */}
			<div className="border-b border-line bg-pitch sticky top-0 z-10">
				<div className="max-w-4xl mx-auto flex overflow-x-auto px-2">
					{(view === "players" ? PLAYER_TABS : COORD_TABS).map(({ id, label, icon: Icon }) => {
						const active = view === "players" ? playerTab === id : coordTab === id;
						return (
							<button
								key={id}
								onClick={() =>
									view === "players" ? setPlayerTab(id as PlayerTab) : setCoordTab(id as CoordTab)
								}
								className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition shrink-0
                ${active ? "border-brand text-brand-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
							>
								<Icon size={16} strokeWidth={2} />
								{label}
							</button>
						);
					})}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1">
				{view === "players" ? (
					<>
						{playerTab === "ranking" && <RankingTab onShowProfile={() => setPlayerTab("perfil")} />}
						{playerTab === "perfil" && <ProfileTab />}
						{playerTab === "matchday" && <MatchdayTab />}
						{playerTab === "analisis" && <AnalysisTab />}
					</>
				) : (
					<>
						{coordTab === "canchas" && <CanchasTab />}
						{coordTab === "sorteo" && <SorteoTab />}
						{coordTab === "apartado" && <ApartadoTab />}
					</>
				)}
			</div>

			{/* CTA */}
			<CtaFooter />
		</div>
	);
}
