"use client";

import { useEffect, useState } from "react";
import { useCockpitState } from "../model/useCockpitState";
import { CockpitTopBar } from "./CockpitTopBar";
import { RosterPanel } from "./RosterPanel";
import { SorteoPanel } from "./SorteoPanel";
import { ContextPanel } from "./ContextPanel";
import { CockpitFooter } from "./CockpitFooter";
import { SettingsDrawer } from "./SettingsDrawer";
import type { CockpitConfig } from "../types";

type CockpitPageProps = {
	leagueId: string;
	leagueName: string;
};

function CreateMatchdayForm({
	leagueName,
	onCreate,
}: {
	leagueName: string;
	onCreate: (date: string) => void;
}) {
	const [date, setDate] = useState("");
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100%",
				gap: 20,
				color: "var(--color-ink)",
			}}
		>
			<div style={{ textAlign: "center" }}>
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
			<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
				<input
					type="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
					style={{
						background: "var(--color-surface-2)",
						border: "1px solid var(--color-line)",
						color: "var(--color-ink)",
						borderRadius: 8,
						padding: "8px 12px",
						fontSize: 14,
						fontFamily: "inherit",
					}}
				/>
				<button className="btn-primary" onClick={() => date && onCreate(date)} disabled={!date}>
					Crear Jornada
				</button>
			</div>
		</div>
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

	function handleConfigChange(_partial: Partial<CockpitConfig>) {
		/* handled by ParametrosTab */
	}

	if (state.loading) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					background: "var(--color-pitch)",
					color: "var(--color-brand)",
					fontFamily: "var(--font-display)",
					fontSize: 20,
				}}
			>
				Cargando…
			</div>
		);
	}

	return (
		<div
			style={{
				position: "relative",
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
				background: "var(--color-pitch)",
				color: "var(--color-ink)",
				fontFamily: "var(--font-body)",
				overflow: "hidden",
			}}
		>
			{!state.matchday ? (
				<CreateMatchdayForm
					leagueName={state.leagueName || leagueName}
					onCreate={state.createMatchday}
				/>
			) : (
				<>
					<CockpitTopBar
						leagueName={state.leagueName || leagueName}
						leagueId={leagueId}
						matchday={state.matchday}
						totalMatchdays={state.totalMatchdays}
						onOpenSettings={() => state.openDrawer("canchas")}
					/>
					{/* Grid: flex-1 + minHeight:0 garantiza que no desborde; overflow:hidden deja scroll a cada panel */}
					<div
						style={{
							flex: 1,
							minHeight: 0,
							display: "grid",
							gridTemplateColumns: "320px 1fr 280px",
							alignItems: "stretch",
							gap: 16,
							padding: "16px 20px",
							overflow: "hidden",
						}}
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
							onSortear={state.sortear}
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
					<CockpitFooter
						matchdayNumber={state.matchday.number}
						status={state.matchday.status}
						hasMatches={state.pairings.length > 0}
						onPublish={state.publishMatchday}
						loading={state.confirmLoading}
						leagueId={leagueId}
					/>
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
							onConfigChange={handleConfigChange}
							onAttendanceChange={state.toggleAttendance}
						/>
					)}
				</>
			)}
		</div>
	);
}
