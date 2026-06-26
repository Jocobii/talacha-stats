"use client";
/**
 * features/match-resolution/model/use-match-resolution.ts
 * Hook principal de estado para la pantalla de captura de partidos.
 */
import { useState, useCallback, useRef } from "react";
import type {
	MatchResolutionData,
	AutosaveStatInput,
	AutosaveMatchFieldsInput,
	ResolveMatchInput,
} from "@/entities/match";
import type { ResolutionState, PlayerStatDraft, TeamSide, SaveStatus } from "../types";
import { AUTOSAVE_DEBOUNCE_MS } from "../constants";
import { patchPlayerStat, patchMatchFields, resolveMatch } from "../lib/match-resolution-api";

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
			} catch (autosaveError) {
				console.error("[useMatchResolution] autosave", autosaveError);
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
				// `field` es un StatColumn | "isPresent" | "shirtNumber" y `value` su valor;
				// se acota al patch parcial del stat (AutosaveStatInput) — cast necesario
				// porque la firma pública recibe `field: string`.
				const patch = { [field]: value } as AutosaveStatInput;
				await patchPlayerStat(state.matchId, registrationId, patch);
			});
		},
		[state.matchId, scheduleAutosave],
	);

	const updateMatchField = useCallback(
		(field: string, value: number | string | null) => {
			setState((prev) => ({ ...prev, [field]: value }));
			if (field === "status") return; // status no se autosavea aquí

			scheduleAutosave(`match-${field}`, async () => {
				// Campo de partido autosaveable (marcador, bonus, observaciones); se acota
				// al patch parcial AutosaveMatchFieldsInput (la firma recibe `field: string`).
				const patch = { [field]: value } as AutosaveMatchFieldsInput;
				await patchMatchFields(state.matchId, patch);
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

		const toStatInput = (p: PlayerStatDraft) => ({
			playerRegistrationId: p.registrationId,
			isPresent: p.isPresent,
			shirtNumber: p.shirtNumber,
			goals: p.goals,
			assists: p.assists,
			yellowCards: p.yellowCards,
			blueCards: p.blueCards,
			redCards: p.redCards,
		});

		const body: ResolveMatchInput = {
			// state.status proviene del status real del partido (DB) — siempre un
			// MatchStatus válido en runtime; el route lo revalida con safeParse.
			status: state.status as ResolveMatchInput["status"],
			homeScore: state.homeScore,
			awayScore: state.awayScore,
			homeBonusGoals: state.homeBonusGoals,
			awayBonusGoals: state.awayBonusGoals,
			refereeObservations: state.refereeObservations,
			homePlayers: state.homePlayers.map(toStatInput),
			awayPlayers: state.awayPlayers.map(toStatInput),
		};

		try {
			const result = await resolveMatch(state.matchId, body);
			setSaveStatus("saved");
			setLastSavedAt(new Date());
			setState((prev) => ({
				...prev,
				homePlayers: prev.homePlayers.map((p) => ({ ...p, dirty: false })),
				awayPlayers: prev.awayPlayers.map((p) => ({ ...p, dirty: false })),
			}));
			return { nextMatchId: result.nextMatchId };
		} catch (saveError) {
			console.error("[useMatchResolution] saveAll", saveError);
			setSaveStatus("error");
			return null;
		}
	}, [state]);

	return { state, saveStatus, lastSavedAt, updatePlayerStat, updateMatchField, addPlayer, saveAll };
}
