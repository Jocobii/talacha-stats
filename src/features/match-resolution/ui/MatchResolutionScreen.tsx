"use client";
/**
 * features/match-resolution/ui/MatchResolutionScreen.tsx
 * Orquestador principal de la pantalla de captura. ≤ 80 líneas.
 */
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScoreHeader } from "./ScoreHeader";
import { TeamPanel } from "./TeamPanel";
import { AdHocPlayerModal } from "./AdHocPlayerModal";
import { ResolutionFooter } from "./ResolutionFooter";
import { MatchdaySidebar } from "./MatchdaySidebar";
import { useMatchResolution } from "../model/use-match-resolution";
import { useKeyboardNav, focusFirstStatInput } from "../model/use-keyboard-nav";
import { CLEAR_STATS_STATUSES } from "../constants";
import { isTeamListDisabled } from "../lib/team-list-lock";
import { isWalkoverStatus } from "../lib/walkover-defaults";
import type { MatchResolutionData } from "@/entities/match/model";
import type { TeamSide, PlayerStatDraft } from "../types";

type SidebarMatch = {
	id: string;
	homeTeamName: string;
	awayTeamName: string;
	status: string;
	homeScore: number | null;
	awayScore: number | null;
};

type Props = {
	initialData: MatchResolutionData;
	leagueId: string;
	matchdayId: string;
	matchdayNumber: number;
	matchdayLabel?: string;
	sidebarMatches: SidebarMatch[];
};

const CAPTURED_STATUSES = new Set([
	"played",
	"walkover_home",
	"walkover_away",
	"suspended",
	"postponed",
	"completed",
]);

export function MatchResolutionScreen({
	initialData,
	leagueId,
	matchdayId,
	matchdayNumber,
	matchdayLabel,
	sidebarMatches,
}: Props) {
	const capturedCount = sidebarMatches.filter((m) => CAPTURED_STATUSES.has(m.status)).length;
	const router = useRouter();
	const {
		state,
		saveStatus,
		lastSavedAt,
		updatePlayerStat,
		updateMatchField,
		addPlayer,
		saveAll,
		homeGoalGap,
		awayGoalGap,
		hasGoalMismatch,
	} = useMatchResolution(initialData);
	const [adHocSide, setAdHocSide] = useState<TeamSide | null>(null);

	useEffect(() => {
		focusFirstStatInput();
	}, []);

	const handleSaveNext = useCallback(async () => {
		// El botón ya se deshabilita con el mismatch (ver ScoreHeader); esta guarda
		// es defensiva por si se dispara vía atajo de teclado (Mod+Enter).
		if (hasGoalMismatch) return;

		const result = await saveAll();
		if (!result) return;
		if (result.nextMatchId) {
			router.push(`/admin/ligas/${leagueId}/jornadas/${matchdayId}/partidos/${result.nextMatchId}`);
		} else {
			router.push(`/admin/ligas/${leagueId}/jornadas/${matchdayId}`);
		}
	}, [hasGoalMismatch, saveAll, router, leagueId, matchdayId]);

	useKeyboardNav({
		onSave: () => saveAll(),
		onSaveNext: handleSaveNext,
		onCancel: () => router.push(`/admin/ligas/${leagueId}/jornadas/${matchdayId}`),
		onAddPlayerHome: () => setAdHocSide("home"),
		onAddPlayerAway: () => setAdHocSide("away"),
	});

	// Suspendido/Pospuesto bloquean ambas listas (no hubo partido). Un W.O.
	// bloquea solo la lista del equipo que no se presentó — la del equipo que
	// sí llegó queda habilitada para tomar asistencia.
	const isLocked = (CLEAR_STATS_STATUSES as readonly string[]).includes(state.status);
	const homeListDisabled = isTeamListDisabled(state.status, "home");
	const awayListDisabled = isTeamListDisabled(state.status, "away");
	// En cualquier W.O. los goles del ganador van a "goles de equipo", nunca
	// por jugador — se bloquea la columna de goles en ambos equipos.
	const goalsLocked = isLocked || isWalkoverStatus(state.status);

	const handleAdded = useCallback(
		(side: TeamSide, player: PlayerStatDraft) => {
			addPlayer(side, player);
			setAdHocSide(null);
		},
		[addPlayer],
	);

	return (
		<div className="flex min-h-screen bg-pitch">
			{/* ── Sidebar de jornada ──────────────────────────────────────────── */}
			<MatchdaySidebar
				matches={sidebarMatches}
				currentMatchId={initialData.match.id}
				leagueId={leagueId}
				matchdayId={matchdayId}
				matchdayNumber={matchdayNumber}
				matchdayLabel={matchdayLabel}
				capturedCount={capturedCount}
			/>

			{/* ── Contenido principal ─────────────────────────────────────────── */}
			<div className="flex flex-col flex-1 min-w-0">
				<ScoreHeader
					data={initialData}
					state={state}
					saveStatus={saveStatus}
					lastSavedAt={lastSavedAt}
					capturedCount={capturedCount}
					totalMatches={sidebarMatches.length}
					matchdayLabel={matchdayLabel}
					hasGoalMismatch={hasGoalMismatch}
					onScoreChange={(side, v) =>
						updateMatchField(side === "home" ? "homeScore" : "awayScore", v)
					}
					onStatusChange={(s) => updateMatchField("status", s)}
					onSaveNext={handleSaveNext}
				/>
				<main className="flex-1 grid grid-cols-2 gap-3 p-3">
					<TeamPanel
						side="home"
						teamName={initialData.homeTeam.name}
						players={state.homePlayers}
						goalGap={homeGoalGap}
						bonusGoals={state.homeBonusGoals}
						disabled={homeListDisabled}
						goalsLocked={goalsLocked}
						absent={state.status === "walkover_away"}
						onStatChange={(id, field, val) => updatePlayerStat("home", id, field, val)}
						onBonusChange={(v) => updateMatchField("homeBonusGoals", v)}
						onAddPlayer={() => setAdHocSide("home")}
					/>
					<TeamPanel
						side="away"
						teamName={initialData.awayTeam.name}
						players={state.awayPlayers}
						goalGap={awayGoalGap}
						bonusGoals={state.awayBonusGoals}
						disabled={awayListDisabled}
						goalsLocked={goalsLocked}
						absent={state.status === "walkover_home"}
						onStatChange={(id, field, val) => updatePlayerStat("away", id, field, val)}
						onBonusChange={(v) => updateMatchField("awayBonusGoals", v)}
						onAddPlayer={() => setAdHocSide("away")}
					/>
				</main>
				<ResolutionFooter
					state={state}
					onObservationsChange={(v) => updateMatchField("refereeObservations", v)}
				/>
			</div>
			{adHocSide && (
				<AdHocPlayerModal
					matchId={state.matchId}
					side={adHocSide}
					existingPlayers={adHocSide === "home" ? state.homePlayers : state.awayPlayers}
					onAdded={(p) => handleAdded(adHocSide, p)}
					onClose={() => setAdHocSide(null)}
				/>
			)}
		</div>
	);
}
