"use client";
/**
 * features/match-resolution/model/use-match-resolution.ts
 * Hook principal de estado para la pantalla de captura de partidos.
 */
import { useState, useCallback, useRef } from "react";
import type { MatchResolutionData } from "@/entities/match/model";
import type { ResolutionState, PlayerStatDraft, TeamSide, SaveStatus } from "../types";
import { AUTOSAVE_DEBOUNCE_MS } from "../constants";

function buildInitialState(data: MatchResolutionData): ResolutionState {
	const toPlayerDraft = (p: MatchResolutionData["homePlayers"][number]): PlayerStatDraft => ({
		registrationId: p.registrationId,
		playerProfileId: p.playerProfileId,
		fullName: p.fullName,
		jerseyNumber: p.jerseyNumber,
		isAdHoc: p.isAdHoc,
		isPresent: p.stat?.isPresent ?? false,
		shirtNumber: p.stat?.shirtNumber ?? p.jerseyNumber ?? null,
		goals: p.stat?.goals ?? 0,
		assists: p.stat?.assists ?? 0,
		yellowCards: p.stat?.yellowCards ?? 0,
		blueCards: p.stat?.blueCards ?? 0,
		redCards: p.stat?.redCards ?? 0,
		dirty: false,
	});

	return {
		matchId: data.match.id,
		status: data.match.status,
		homeScore: data.match.homeScore,
		awayScore: data.match.awayScore,
		homeBonusGoals: data.match.homeBonusGoals,
		awayBonusGoals: data.match.awayBonusGoals,
		refereeObservations: data.match.refereeObservations,
		homePlayers: data.homePlayers.map(toPlayerDraft),
		awayPlayers: data.awayPlayers.map(toPlayerDraft),
	};
}

export type UseMatchResolutionReturn = {
	state: ResolutionState;
	saveStatus: SaveStatus;
	lastSavedAt: Date | null;
	updatePlayerStat: (
		side: TeamSide,
		registrationId: string,
		field: string,
		value: number | boolean,
	) => void;
	updateMatchField: (
		field: keyof Pick<
			ResolutionState,
			| "homeScore"
			| "awayScore"
			| "homeBonusGoals"
			| "awayBonusGoals"
			| "refereeObservations"
			| "status"
		>,
		value: number | string | null,
	) => void;
	addPlayer: (side: TeamSide, player: PlayerStatDraft) => void;
	saveAll: () => Promise<{ nextMatchId: string | null } | null>;
};

export function useMatchResolution(initialData: MatchResolutionData): UseMatchResolutionReturn {
	const [state, setState] = useState<ResolutionState>(() => buildInitialState(initialData));
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const scheduleAutosave = useCallback((key: string, fn: () => Promise<void>) => {
		const existing = debounceTimers.current.get(key);
		if (existing) clearTimeout(existing);

		const timer = setTimeout(async () => {
			debounceTimers.current.delete(key);
			setSaveStatus("saving");
			try {
				await fn();
				setSaveStatus("saved");
				setLastSavedAt(new Date());
			} catch {
				setSaveStatus("error");
			}
		}, AUTOSAVE_DEBOUNCE_MS);

		debounceTimers.current.set(key, timer);
	}, []);

	const updatePlayerStat = useCallback(
		(side: TeamSide, registrationId: string, field: string, value: number | boolean) => {
			setState((prev) => {
				const list = side === "home" ? prev.homePlayers : prev.awayPlayers;
				const updated = list.map((p) => {
					if (p.registrationId !== registrationId) return p;
					const next = { ...p, [field]: value, dirty: true };
					// Marcar presente automáticamente si hay stats > 0
					if (
						typeof value === "number" &&
						value > 0 &&
						["goals", "assists", "yellowCards", "blueCards", "redCards"].includes(field)
					) {
						next.isPresent = true;
					}
					return next;
				});
				return side === "home"
					? { ...prev, homePlayers: updated }
					: { ...prev, awayPlayers: updated };
			});

			scheduleAutosave(`stat-${registrationId}-${field}`, async () => {
				await fetch(`/api/matches/${state.matchId}/stats/${registrationId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ [field]: value }),
				});
			});
		},
		[state.matchId, scheduleAutosave],
	);

	const updateMatchField = useCallback(
		(field: string, value: number | string | null) => {
			setState((prev) => ({ ...prev, [field]: value }));
			if (field === "status") return; // status no se autosavea aquí

			scheduleAutosave(`match-${field}`, async () => {
				await fetch(`/api/matches/${state.matchId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ [field]: value }),
				});
			});
		},
		[state.matchId, scheduleAutosave],
	);

	const addPlayer = useCallback((side: TeamSide, player: PlayerStatDraft) => {
		setState((prev) => {
			const list = side === "home" ? prev.homePlayers : prev.awayPlayers;
			const updated = [...list, player];
			return side === "home"
				? { ...prev, homePlayers: updated }
				: { ...prev, awayPlayers: updated };
		});
	}, []);

	const saveAll = useCallback(async (): Promise<{ nextMatchId: string | null } | null> => {
		setSaveStatus("saving");
		try {
			const body = {
				status: state.status,
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
			};

			const res = await fetch(`/api/matches/${state.matchId}/resolve`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) throw new Error("Error al guardar");

			const data = await res.json();
			setSaveStatus("saved");
			setLastSavedAt(new Date());
			setState((prev) =>
				prev.homePlayers
					? {
							...prev,
							homePlayers: prev.homePlayers.map((p) => ({ ...p, dirty: false })),
							awayPlayers: prev.awayPlayers.map((p) => ({ ...p, dirty: false })),
						}
					: prev,
			);

			return { nextMatchId: data.data?.nextMatchId ?? null };
		} catch {
			setSaveStatus("error");
			return null;
		}
	}, [state]);

	return { state, saveStatus, lastSavedAt, updatePlayerStat, updateMatchField, addPlayer, saveAll };
}
