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
import { validateResolution } from "../lib/validate-resolution";
import type { MatchResolutionData } from "@/entities/match/model";
import type { TeamSide, PlayerStatDraft } from "../types";
import type { ResolutionStatus } from "@/db/schema";

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
	sidebarMatches,
}: Props) {
	const capturedCount = sidebarMatches.filter((m) => CAPTURED_STATUSES.has(m.status)).length;
	const router = useRouter();
	const { state, saveStatus, lastSavedAt, updatePlayerStat, updateMatchField, addPlayer, saveAll } =
		useMatchResolution(initialData);
	const [adHocSide, setAdHocSide] = useState<TeamSide | null>(null);

	useEffect(() => {
		focusFirstStatInput();
	}, []);

	const handleSaveNext = useCallback(async () => {
		const warnings = validateResolution({
			status: state.status as ResolutionStatus,
			homeScore: state.homeScore,
			awayScore: state.awayScore,
			homeBonusGoals: state.homeBonusGoals,
			awayBonusGoals: state.awayBonusGoals,
			refereeObservations: state.refereeObservations,
			homePlayers: state.homePlayers.map((p) => ({
				playerRegistrationId: p.registrationId,
				isPresent: p.isPresent,
				shirtNumber: p.shirtNumber,
				goals: p.goals,
				assists: p.assists,
				yellowCards: p.yellowCards,
				blueCards: p.blueCards,
				redCards: p.redCards,
			})),
			awayPlayers: state.awayPlayers.map((p) => ({
				playerRegistrationId: p.registrationId,
				isPresent: p.isPresent,
				shirtNumber: p.shirtNumber,
				goals: p.goals,
				assists: p.assists,
				yellowCards: p.yellowCards,
				blueCards: p.blueCards,
				redCards: p.redCards,
			})),
		});
		const hasGap = warnings.some((w) => w.code === "home_gap" || w.code === "away_gap");
		if (
			hasGap &&
			!confirm("Hay diferencias entre el marcador y la suma de goles. ¿Guardar de todos modos?")
		)
			return;

		const result = await saveAll();
		if (!result) return;
		if (result.nextMatchId) {
			router.push(`/admin/ligas/${leagueId}/jornadas/${matchdayId}/partidos/${result.nextMatchId}`);
		} else {
			router.push(`/admin/ligas/${leagueId}/jornadas/${matchdayId}`);
		}
	}, [state, saveAll, router, leagueId, matchdayId]);

	useKeyboardNav({
		onSave: () => saveAll(),
		onSaveNext: handleSaveNext,
		onCancel: () => router.push(`/admin/ligas/${leagueId}/jornadas/${matchdayId}`),
		onAddPlayerHome: () => setAdHocSide("home"),
		onAddPlayerAway: () => setAdHocSide("away"),
	});

	const isLocked = ["walkover_home", "walkover_away", "suspended", "postponed"].includes(
		state.status,
	);

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
						bonusGoals={state.homeBonusGoals}
						disabled={isLocked}
						onStatChange={(id, field, val) => updatePlayerStat("home", id, field, val)}
						onBonusChange={(v) => updateMatchField("homeBonusGoals", v)}
						onAddPlayer={() => setAdHocSide("home")}
					/>
					<TeamPanel
						side="away"
						teamName={initialData.awayTeam.name}
						players={state.awayPlayers}
						bonusGoals={state.awayBonusGoals}
						disabled={isLocked}
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
