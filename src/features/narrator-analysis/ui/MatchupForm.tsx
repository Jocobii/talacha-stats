"use client";

/**
 * features/narrator-analysis/ui/MatchupForm.tsx
 *
 * Formulario de selección de liga + equipos del análisis pre-partido.
 * Componente tonto (§17.1/§7.3): recibe ViewModels y callbacks por props, cero
 * fetch, cero mapeo, cero regla de negocio. El estado vive en `useNarratorMatchup`.
 */

import type { ReactNode } from "react";
import { MATCHUP_SELECT_CLASS } from "../constants";
import type { TeamOption } from "../types";

type Labels = {
	league: string;
	teamA: string;
	teamB: string;
	selectPlaceholder: string;
	generate: string;
	analyzing: string;
};

type Props = {
	/**
	 * <select> de liga, ya resuelto por el llamador (`app/`). `LeagueSelect` es
	 * de `features/league-selection`; esta feature no puede importarla (§3.1),
	 * así que recibe el elemento ya armado como slot.
	 */
	leagueSelect: ReactNode;
	teams: TeamOption[];
	teamA: string;
	onTeamAChange: (teamId: string) => void;
	teamB: string;
	onTeamBChange: (teamId: string) => void;
	errorMessage: string | null;
	isSubmitting: boolean;
	onSubmit: () => void;
	labels: Labels;
};

export function MatchupForm({
	leagueSelect,
	teams,
	teamA,
	onTeamAChange,
	teamB,
	onTeamBChange,
	errorMessage,
	isSubmitting,
	onSubmit,
	labels,
}: Props) {
	return (
		<div className="bg-surface-2 border border-line rounded-2xl p-5 space-y-4">
			<div>
				<label className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2">
					{labels.league}
				</label>
				{leagueSelect}
			</div>

			{teams.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<TeamPicker
						dotClassName="bg-blue-400"
						label={labels.teamA}
						value={teamA}
						onChange={onTeamAChange}
						teams={teams.filter((team) => team.id !== teamB)}
						placeholder={labels.selectPlaceholder}
					/>
					<TeamPicker
						dotClassName="bg-red-400"
						label={labels.teamB}
						value={teamB}
						onChange={onTeamBChange}
						teams={teams.filter((team) => team.id !== teamA)}
						placeholder={labels.selectPlaceholder}
					/>
				</div>
			)}

			{errorMessage && (
				<p className="text-red-400 text-sm bg-red-950 border border-red-900 px-3 py-2 rounded-xl">
					{errorMessage}
				</p>
			)}

			<button
				onClick={onSubmit}
				disabled={isSubmitting || !teamA || !teamB}
				className="w-full bg-brand hover:bg-brand-dim disabled:opacity-40 text-pitch font-display font-black text-lg uppercase tracking-wide py-3.5 rounded-xl transition"
			>
				{isSubmitting ? labels.analyzing : labels.generate}
			</button>
		</div>
	);
}

function TeamPicker({
	dotClassName,
	label,
	value,
	onChange,
	teams,
	placeholder,
}: {
	dotClassName: string;
	label: string;
	value: string;
	onChange: (teamId: string) => void;
	teams: TeamOption[];
	placeholder: string;
}) {
	return (
		<div>
			<label className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2">
				<span className={`inline-block w-2 h-2 rounded-full ${dotClassName} mr-1.5`} />
				{label}
			</label>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={MATCHUP_SELECT_CLASS}
			>
				<option value="">{placeholder}</option>
				{teams.map((team) => (
					<option key={team.id} value={team.id}>
						{team.name}
					</option>
				))}
			</select>
		</div>
	);
}
