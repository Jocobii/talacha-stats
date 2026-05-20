"use client";
/**
 * BracketSlot.tsx
 *
 * Renders a single bracket slot with two team rows. Highlights the winner.
 * Includes an edit button to change team assignments before the match is played.
 * Includes a "Capturar →" link when a match record exists and hasn't been resolved.
 */

import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import Link from "next/link";

export type SlotData = {
	id: string;
	round: number;
	slotIndex: number;
	isThirdPlace: boolean;
	isBye: boolean;
	homeTeam: { id: string; name: string } | null;
	awayTeam: { id: string; name: string } | null;
	winner: { id: string; name: string } | null;
	matchId: string | null;
};

type Props = {
	slot: SlotData;
	bracketId: string;
	leagueId: string;
	playoffMatchdayId: string;
	availableTeams: { id: string; name: string }[];
};

export function BracketSlot({
	slot,
	bracketId,
	leagueId,
	playoffMatchdayId,
	availableTeams,
}: Props) {
	const [editing, setEditing] = useState(false);
	const [homeId, setHomeId] = useState(slot.homeTeam?.id ?? "");
	const [awayId, setAwayId] = useState(slot.awayTeam?.id ?? "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fix: only flag winner when winner is non-null
	const isHomeWinner = slot.winner !== null && slot.winner.id === slot.homeTeam?.id;
	const isAwayWinner = slot.winner !== null && slot.winner.id === slot.awayTeam?.id;
	const hasResult = slot.winner !== null;
	const isBye = slot.isBye;

	const canCapture =
		slot.matchId !== null && !hasResult && slot.homeTeam !== null && slot.awayTeam !== null;

	const handleSave = async () => {
		setSaving(true);
		setError(null);
		const res = await fetch(`/api/leagues/${leagueId}/playoffs/${bracketId}/slots/${slot.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				homeTeamId: homeId || null,
				awayTeamId: awayId || null,
			}),
		});
		const json = await res.json();
		setSaving(false);
		if (!res.ok) {
			setError(json.error ?? "Error");
			return;
		}
		setEditing(false);
	};

	const teamRow = (
		team: { id: string; name: string } | null,
		isWinner: boolean,
		isTop: boolean,
	) => (
		<div
			className={`flex items-center gap-1.5 px-2 py-1.5 ${
				isWinner ? "bg-brand/10 border-l-2 border-l-brand" : "border-l-2 border-l-transparent"
			} ${isTop ? "border-b border-line" : ""}`}
		>
			<span
				className={`text-xs truncate flex-1 ${
					isWinner ? "text-ink font-bold" : hasResult ? "text-ink-3" : "text-ink-2"
				}`}
			>
				{team?.name ?? <span className="italic text-ink-3">TBD</span>}
			</span>
			{isWinner && <span className="text-brand text-[10px] font-black">WIN</span>}
		</div>
	);

	return (
		<div className="relative group bg-surface-2 border border-line rounded overflow-hidden w-44 shrink-0">
			{/* Third-place label */}
			{slot.isThirdPlace && (
				<div className="text-[9px] text-ink-3 font-bold uppercase tracking-wide px-2 pt-1">
					3er lugar
				</div>
			)}

			{isBye ? (
				<div className="px-2 py-2 text-xs text-ink-3 italic">Descansa</div>
			) : editing ? (
				<EditForm
					homeId={homeId}
					awayId={awayId}
					onHomeChange={setHomeId}
					onAwayChange={setAwayId}
					availableTeams={availableTeams}
					onSave={handleSave}
					onCancel={() => setEditing(false)}
					saving={saving}
					error={error}
				/>
			) : (
				<>
					{teamRow(slot.homeTeam, isHomeWinner, true)}
					{teamRow(slot.awayTeam, isAwayWinner, false)}
					{/* Capture link */}
					{canCapture && (
						<Link
							href={`/admin/ligas/${leagueId}/jornadas/${playoffMatchdayId}/partidos/${slot.matchId}`}
							className="flex items-center justify-center text-[10px] font-bold text-pitch bg-brand hover:bg-brand-dim transition-colors py-1"
						>
							Capturar →
						</Link>
					)}
					{hasResult && (
						<Link
							href={`/admin/ligas/${leagueId}/jornadas/${playoffMatchdayId}/partidos/${slot.matchId}`}
							className="flex items-center justify-center text-[10px] text-ink-3 hover:text-brand transition-colors py-1 border-t border-line"
						>
							Ver resultado
						</Link>
					)}
				</>
			)}

			{/* Edit button — only when not yet resolved and not editing */}
			{!hasResult && !isBye && !editing && (
				<button
					onClick={() => setEditing(true)}
					className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-ink-3 hover:text-brand"
					aria-label="Editar equipos"
				>
					<Edit2 size={12} />
				</button>
			)}
		</div>
	);
}

// ── Sub-component for inline editing ──────────────────────────────────────────

type EditFormProps = {
	homeId: string;
	awayId: string;
	availableTeams: { id: string; name: string }[];
	onHomeChange: (v: string) => void;
	onAwayChange: (v: string) => void;
	onSave: () => void;
	onCancel: () => void;
	saving: boolean;
	error: string | null;
};

function EditForm({
	homeId,
	awayId,
	availableTeams,
	onHomeChange,
	onAwayChange,
	onSave,
	onCancel,
	saving,
	error,
}: EditFormProps) {
	return (
		<div className="p-2 space-y-1.5">
			<TeamSelect value={homeId} onChange={onHomeChange} teams={availableTeams} />
			<TeamSelect value={awayId} onChange={onAwayChange} teams={availableTeams} />
			{error && <p className="text-[10px] text-rose">{error}</p>}
			<div className="flex gap-1">
				<button
					onClick={onSave}
					disabled={saving}
					className="flex-1 flex items-center justify-center gap-0.5 bg-brand text-pitch text-[10px] font-bold py-1 rounded transition-colors disabled:opacity-50"
				>
					<Check size={10} />
					OK
				</button>
				<button
					onClick={onCancel}
					className="flex-1 flex items-center justify-center gap-0.5 bg-surface border border-line text-ink-3 text-[10px] py-1 rounded"
				>
					<X size={10} />
				</button>
			</div>
		</div>
	);
}

function TeamSelect({
	value,
	onChange,
	teams,
}: {
	value: string;
	onChange: (v: string) => void;
	teams: { id: string; name: string }[];
}) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="w-full text-[10px] bg-surface border border-line rounded px-1.5 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-brand/40"
		>
			<option value="">— TBD —</option>
			{teams.map((t) => (
				<option key={t.id} value={t.id}>
					{t.name}
				</option>
			))}
		</select>
	);
}
