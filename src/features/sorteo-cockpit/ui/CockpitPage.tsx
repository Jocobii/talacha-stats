"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { Stack, Inline, Center } from "@/shared/ui/layout";
import { cn } from "@/shared/lib/cn";
import { useCockpitState } from "../model/useCockpitState";
import { useMatchdayCreateTransition } from "../model/useMatchdayCreateTransition";
import { MIN_TEAMS_FOR_MATCHDAY } from "../constants";
import { CockpitTopBar } from "./CockpitTopBar";
import { RosterPanel } from "./RosterPanel";
import { SorteoPanel } from "./SorteoPanel";
import { ContextPanel } from "./ContextPanel";
import { CockpitFooter } from "./CockpitFooter";
import { SettingsDrawer } from "./SettingsDrawer";
import { SorteoRequirements } from "./SorteoRequirements";
import { CockpitDatePicker } from "./CockpitDatePicker";
import { SeasonCompletePanel } from "./SeasonCompletePanel";

type CockpitPageProps = {
	leagueId: string;
	leagueName: string;
};

function CreateMatchdayForm({
	leagueName,
	onCreate,
	loading,
}: {
	leagueName: string;
	onCreate: (date: string) => void;
	loading: boolean;
}) {
	const [date, setDate] = useState("");
	return (
		<Stack
			align="center"
			gap="lg"
			className="h-full justify-center"
			style={{ color: "var(--color-ink)" }}
		>
			<div className="text-center">
				<Center
					className="mx-auto mb-3.5 h-14 w-14 rounded-2xl"
					style={{ background: "rgba(0,230,118,0.1)" }}
				>
					<Trophy size={24} strokeWidth={2} color="var(--color-brand)" />
				</Center>
				<div
					style={{
						fontFamily: "var(--font-display)",
						fontSize: 28,
						fontWeight: 800,
						marginBottom: 8,
					}}
				>
					{leagueName}
				</div>
				<div style={{ fontSize: 14, color: "var(--color-ink-2)" }}>
					No hay jornada activa. Crea una nueva para comenzar.
				</div>
			</div>
			<Inline gap="sm" align="center">
				<CockpitDatePicker value={date} onChange={setDate} disabled={loading} />
				<button
					className="btn-primary"
					onClick={() => date && onCreate(date)}
					disabled={!date || loading}
				>
					{loading && <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />}
					{loading ? "Creando…" : "Crear Jornada"}
				</button>
			</Inline>
		</Stack>
	);
}

export function CockpitPage({ leagueId, leagueName }: CockpitPageProps) {
	const state = useCockpitState(leagueId);

	useEffect(() => {
		void state.loadCurrent();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [leagueId]);

	const presentTeams = state.teams.filter((t) => t.status === "presente");
	const isCompleted = state.matchday?.status === "completed";
	const hasVenue = state.venues.length > 0;
	const meetsRequirements = hasVenue && state.teamsCount >= MIN_TEAMS_FOR_MATCHDAY;
	const { showCreateForm, formExiting, layoutEntering } = useMatchdayCreateTransition(
		!!state.matchday,
	);

	if (state.loading) {
		return (
			<Center
				className="h-full"
				style={{
					background: "var(--color-pitch)",
					color: "var(--color-brand)",
					fontFamily: "var(--font-display)",
					fontSize: 20,
				}}
			>
				Cargando…
			</Center>
		);
	}

	if (state.loadError) {
		return (
			<Stack
				align="center"
				gap="sm"
				className="h-full justify-center"
				style={{ background: "var(--color-pitch)", fontFamily: "var(--font-body)" }}
			>
				<span style={{ fontSize: 16, color: "var(--color-ink)" }}>No se pudo cargar el sorteo</span>
				<span
					style={{ fontSize: 12, color: "var(--color-ink-3)", maxWidth: 340, textAlign: "center" }}
				>
					{state.loadError}
				</span>
				<button className="btn-ghost mt-2" onClick={() => void state.loadCurrent()}>
					Reintentar
				</button>
			</Stack>
		);
	}

	return (
		<Stack
			gap="none"
			className="relative h-full min-h-0 overflow-hidden"
			style={{
				background: "var(--color-pitch)",
				color: "var(--color-ink)",
				fontFamily: "var(--font-body)",
			}}
		>
			{showCreateForm ? (
				<div
					style={
						formExiting
							? {
									opacity: 0,
									transform: "scale(1.02)",
									transition: "opacity 0.4s ease, transform 0.4s ease",
								}
							: undefined
					}
				>
					{state.seasonComplete ? (
						<SeasonCompletePanel
							leagueId={leagueId}
							leagueName={state.leagueName || leagueName}
							playoffStarted={state.playoffStarted}
						/>
					) : meetsRequirements ? (
						<CreateMatchdayForm
							leagueName={state.leagueName || leagueName}
							onCreate={state.createMatchday}
							loading={state.createLoading}
						/>
					) : (
						<SorteoRequirements
							leagueId={leagueId}
							teamsCount={state.teamsCount}
							hasVenue={hasVenue}
						/>
					)}
				</div>
			) : (
				state.matchday && (
					<>
						<div className={cn(layoutEntering && "animate-fade-slide-up [animation-delay:60ms]")}>
							<CockpitTopBar
								leagueId={leagueId}
								matchday={state.matchday}
								totalMatchdays={state.totalMatchdays}
								onOpenSettings={() => state.openDrawer("canchas")}
							/>
						</div>
						{/* Grid: flex-1 + minHeight:0 garantiza que no desborde; overflow:hidden deja scroll a cada panel */}
						<div
							className={cn(
								"grid flex-1 min-h-0 grid-cols-[320px_1fr_280px] items-stretch gap-4 overflow-hidden px-5 py-4",
								layoutEntering && "animate-fade-slide-up [animation-delay:130ms]",
							)}
						>
							<RosterPanel
								teams={state.teams}
								onToggleAttendance={state.toggleAttendance}
								pairingCount={state.pairings.length}
								disabled={isCompleted}
							/>
							<SorteoPanel
								pairings={state.pairings}
								venues={state.venues}
								presentTeams={presentTeams}
								recentPairKeys={state.recentPairKeys}
								config={state.config}
								loading={state.sortearLoading}
								disabled={isCompleted}
								onChangeTeam={state.changeTeam}
								onSwap={state.swapHomeAway}
								onDelete={state.deletePairing}
								onVenueChange={state.changeVenue}
								onTimeChange={state.changeTime}
								saveStatus={state.saveStatus}
								onSortear={state.sortear}
								onAddManual={state.addManualPairing}
								onOpenSettings={state.openDrawer}
							/>
							<ContextPanel
								matchday={state.matchday}
								leagueId={leagueId}
								onOpenSettings={state.openDrawer}
								config={state.config}
								venues={state.venues}
							/>
						</div>
						{/* Footer: flexShrink:0, siempre visible al fondo */}
						<div className={cn(layoutEntering && "animate-fade-slide-up [animation-delay:200ms]")}>
							<CockpitFooter
								matchdayNumber={state.matchday.number}
								status={state.matchday.status}
								hasMatches={state.pairings.length > 0}
								onPublish={state.publishMatchday}
								loading={state.publishLoading}
								leagueId={leagueId}
							/>
						</div>
						{state.drawerOpen && (
							<SettingsDrawer
								leagueId={leagueId}
								leagueName={state.leagueName || leagueName}
								open={state.drawerOpen}
								activeTab={state.activeDrawerTab}
								onClose={state.closeDrawer}
								onTabChange={state.openDrawer}
								venues={state.venues}
								config={state.config}
								teams={state.teams}
								matchdayNumber={state.matchday.number}
								onConfigChange={state.updateConfig}
								onSave={state.loadCurrent}
								onAttendanceChange={state.toggleAttendance}
							/>
						)}
					</>
				)
			)}
		</Stack>
	);
}
