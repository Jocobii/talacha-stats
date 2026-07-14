"use client";

/**
 * features/discipline/ui/SuspensionModal.tsx
 * Panel de "Registrar sanción" (alta manual) / "Escalar sanción" / "Levantar
 * veto" — fiel al mockup Suspensiones.html (EscalatePanel/LiftPanel), pero
 * sobre <Modal> (centrado) en vez del drawer lateral del mockup: es el patrón
 * que ya usa el resto del admin (shared/ui/Modal), no se introduce uno nuevo.
 */

import { useState } from "react";
import { Ban, Calendar, Check, Undo2, User } from "lucide-react";
import { Modal, Field, Input, Select, Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type {
	CreateManualSuspensionInput,
	EscalateSuspensionInput,
	SuspensionDurationUnit,
	SuspensionLeagueOption,
	SuspensionListItemDto,
	SuspensionRosterPlayer,
} from "@/entities/suspension";
import { addDurationIso, todayIso } from "../lib/add-duration";
import { fmtIsoDate } from "../lib/format-suspension";
import { useLeagueRosterForDiscipline } from "../model/useLeagueRosterForDiscipline";

export type SuspensionModalState =
	| { mode: "new" }
	| { mode: "escalate"; subject: SuspensionListItemDto }
	| { mode: "lift"; subject: SuspensionListItemDto };

type Props = {
	modal: SuspensionModalState;
	/** Vista por liga: roster ya resuelto. Vista global (B7b): omitir y pasar `leagues`. */
	roster?: SuspensionRosterPlayer[];
	/** Vista global (B7b): selector de liga — el roster se carga bajo demanda por liga elegida. */
	leagues?: SuspensionLeagueOption[];
	currentUserName: string;
	onClose: () => void;
	onCreate: (leagueId: string, input: CreateManualSuspensionInput) => void;
	onEscalateOrLift: (input: EscalateSuspensionInput) => void;
	pending: boolean;
};

export function SuspensionModal({
	modal,
	roster,
	leagues,
	currentUserName,
	onClose,
	onCreate,
	onEscalateOrLift,
	pending,
}: Props) {
	if (modal.mode === "lift") {
		return (
			<LiftPanel
				subject={modal.subject}
				onClose={onClose}
				onSubmit={onEscalateOrLift}
				pending={pending}
			/>
		);
	}

	return (
		<EscalatePanel
			mode={modal.mode}
			subject={modal.mode === "escalate" ? modal.subject : null}
			roster={roster ?? []}
			leagues={leagues}
			currentUserName={currentUserName}
			onClose={onClose}
			onCreate={onCreate}
			onEscalate={onEscalateOrLift}
			pending={pending}
		/>
	);
}

type DurationChoice = "matches" | "time" | "permanent";

function EscalatePanel({
	mode,
	subject,
	roster: staticRoster,
	leagues,
	currentUserName,
	onClose,
	onCreate,
	onEscalate,
	pending,
}: {
	mode: "new" | "escalate";
	subject: SuspensionListItemDto | null;
	roster: SuspensionRosterPlayer[];
	leagues?: SuspensionLeagueOption[];
	currentUserName: string;
	onClose: () => void;
	onCreate: (leagueId: string, input: CreateManualSuspensionInput) => void;
	onEscalate: (input: EscalateSuspensionInput) => void;
	pending: boolean;
}) {
	const isGlobal = mode === "new" && leagues !== undefined;

	const [type, setType] = useState<DurationChoice>(mode === "escalate" ? "time" : "matches");
	const [leagueId, setLeagueId] = useState(leagues?.[0]?.id ?? "");
	const rosterQuery = useLeagueRosterForDiscipline(isGlobal ? leagueId : null);
	const roster = isGlobal ? (rosterQuery.data ?? []) : staticRoster;

	// Selección explícita del usuario, si sigue siendo válida contra el roster actual;
	// si no (cambió de liga, o el roster todavía no cargó), cae al primero — derivado en
	// render, no en efecto (§7.2 AGENTS.md: nada de setState dentro de useEffect).
	const [globalPlayerIdChoice, setGlobalPlayerIdChoice] = useState<string | null>(null);
	const globalPlayerId =
		globalPlayerIdChoice && roster.some((p) => p.globalPlayerId === globalPlayerIdChoice)
			? globalPlayerIdChoice
			: (roster[0]?.globalPlayerId ?? "");

	const [matchesTotal, setMatchesTotal] = useState(2);
	const [amount, setAmount] = useState(3);
	const [unit, setUnit] = useState<SuspensionDurationUnit>("weeks");
	const [reasonDetail, setReasonDetail] = useState("");

	const endsOn = type === "time" ? addDurationIso(todayIso(), amount, unit) : null;
	const canSubmit =
		reasonDetail.trim().length > 0 &&
		(mode === "escalate" || (globalPlayerId.length > 0 && (!isGlobal || leagueId.length > 0)));

	function handleSubmit() {
		if (!canSubmit) return;

		if (mode === "new") {
			const base = { globalPlayerId, reasonDetail: reasonDetail.trim() };
			if (type === "matches") {
				onCreate(leagueId, { ...base, durationType: "matches", matchesTotal });
			} else if (type === "time") {
				onCreate(leagueId, {
					...base,
					durationType: "time",
					durationValue: amount,
					durationUnit: unit,
				});
			} else {
				onCreate(leagueId, { ...base, durationType: "permanent" });
			}
			return;
		}

		// mode === "escalate" — nunca vuelve a "matches", solo time o permanent.
		if (type === "time") {
			onEscalate({
				action: "escalate",
				durationType: "time",
				durationValue: amount,
				durationUnit: unit,
				reasonDetail: reasonDetail.trim(),
			});
		} else {
			onEscalate({
				action: "escalate",
				durationType: "permanent",
				reasonDetail: reasonDetail.trim(),
			});
		}
	}

	return (
		<Modal
			onClose={onClose}
			title={mode === "new" ? "Registrar sanción" : "Escalar sanción"}
			size="md"
		>
			<div className="flex flex-col gap-5 px-6 py-6">
				{mode === "escalate" && subject && (
					<p className="text-[13px] text-ink-2 -mt-1">
						{subject.playerName} · {subject.teamName}
					</p>
				)}

				{isGlobal && (
					<Field label="Liga" required>
						<Select value={leagueId} onChange={(e) => setLeagueId(e.target.value)}>
							{leagues!.map((l) => (
								<option key={l.id} value={l.id}>
									{l.name}
								</option>
							))}
						</Select>
					</Field>
				)}

				{mode === "new" && (
					<Field label="Jugador" required>
						<Select
							value={globalPlayerId}
							onChange={(e) => setGlobalPlayerIdChoice(e.target.value)}
							disabled={isGlobal && rosterQuery.isLoading}
						>
							{isGlobal && rosterQuery.isLoading ? (
								<option value="">Cargando roster…</option>
							) : (
								roster.map((p) => (
									<option key={p.globalPlayerId} value={p.globalPlayerId}>
										{p.fullName} — {p.teamName}
									</option>
								))
							)}
						</Select>
					</Field>
				)}

				<Field label="Tipo de castigo" required>
					<div className="inline-flex bg-surface-2 border border-line rounded-md p-1 gap-1 w-full">
						{(
							[
								{ v: "matches" as const, l: "Por partidos", disabled: mode === "escalate" },
								{ v: "time" as const, l: "Por tiempo" },
								{ v: "permanent" as const, l: "Indefinido" },
							] satisfies { v: DurationChoice; l: string; disabled?: boolean }[]
						).map((o) => (
							<button
								key={o.v}
								type="button"
								disabled={o.disabled}
								onClick={() => setType(o.v)}
								className={cn(
									"flex-1 h-8 rounded text-[12.5px] font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed",
									type === o.v ? "bg-brand text-pitch" : "text-ink-2 hover:text-ink",
								)}
							>
								{o.l}
							</button>
						))}
					</div>
				</Field>

				{type === "matches" && (
					<Field label="Número de fechas" required>
						<Input
							type="number"
							min={1}
							value={matchesTotal}
							onChange={(e) => setMatchesTotal(Number(e.target.value) || 1)}
						/>
					</Field>
				)}

				{type === "time" && (
					<>
						<div className="grid grid-cols-[1fr_140px] gap-3">
							<Field label="Cantidad" required>
								<Input
									type="number"
									min={1}
									value={amount}
									onChange={(e) => setAmount(Number(e.target.value) || 1)}
								/>
							</Field>
							<Field label="Unidad" required>
								<Select
									value={unit}
									onChange={(e) => setUnit(e.target.value as SuspensionDurationUnit)}
								>
									<option value="days">Días</option>
									<option value="weeks">Semanas</option>
									<option value="months">Meses</option>
								</Select>
							</Field>
						</div>
						<div className="bg-surface-2/60 border border-line rounded-md px-3.5 py-3 flex items-center gap-2.5">
							<Calendar size={15} strokeWidth={1.75} className="text-amber-300 shrink-0" />
							<p className="text-[13px] text-ink">
								Termina el <span className="font-semibold">{endsOn && fmtIsoDate(endsOn)}</span>
							</p>
						</div>
					</>
				)}

				{type === "permanent" && (
					<div className="bg-red-500/[0.06] border border-red-500/20 rounded-md px-3.5 py-3 flex items-center gap-2.5">
						<Ban size={15} strokeWidth={1.75} className="text-red-400 shrink-0" />
						<p className="text-[13px] text-ink">
							Veto indefinido — el jugador no podrá participar hasta que se levante manualmente.
						</p>
					</div>
				)}

				<Field label="Motivo" required hint="Queda registrado en el historial del jugador">
					<textarea
						value={reasonDetail}
						onChange={(e) => setReasonDetail(e.target.value)}
						placeholder="Ej. Amenazas al árbitro tras la expulsión"
						rows={4}
						className="w-full rounded-md bg-surface-2 border border-line px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition resize-none"
					/>
				</Field>

				<div className="flex items-center gap-2 text-[12px] text-ink-3 -mt-1">
					<User size={13} strokeWidth={1.75} />
					Registra: <span className="text-ink-2 font-medium">{currentUserName}</span>
				</div>
			</div>

			<div className="px-6 py-5 border-t border-line flex items-center justify-end gap-2">
				<Button variant="ghost" size="md" onClick={onClose}>
					Cancelar
				</Button>
				<Button
					variant="primary"
					size="md"
					icon={Check}
					disabled={!canSubmit || pending}
					onClick={handleSubmit}
				>
					{mode === "new" ? "Aplicar sanción" : "Escalar sanción"}
				</Button>
			</div>
		</Modal>
	);
}

function LiftPanel({
	subject,
	onClose,
	onSubmit,
	pending,
}: {
	subject: SuspensionListItemDto;
	onClose: () => void;
	onSubmit: (input: EscalateSuspensionInput) => void;
	pending: boolean;
}) {
	const [note, setNote] = useState("");

	return (
		<Modal onClose={onClose} title="Levantar veto" size="md">
			<div className="flex flex-col gap-5 px-6 py-6">
				<p className="text-[13px] text-ink-2 -mt-1">
					{subject.playerName} · {subject.teamName}
				</p>
				<div className="bg-surface-2/60 border border-line rounded-md px-3.5 py-3">
					<div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">
						Motivo del veto
					</div>
					<p className="text-[13.5px] text-ink mt-1 whitespace-pre-wrap">
						{subject.reasonDetail || "Sin motivo registrado."}
					</p>
				</div>
				<Field label="Nota de levantamiento" hint="Opcional — queda en el historial">
					<textarea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Ej. Cumplió el acuerdo de disciplina con la liga"
						rows={3}
						className="w-full rounded-md bg-surface-2 border border-line px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition resize-none"
					/>
				</Field>
			</div>
			<div className="px-6 py-5 border-t border-line flex items-center justify-end gap-2">
				<Button variant="ghost" size="md" onClick={onClose}>
					Cancelar
				</Button>
				<Button
					variant="primary"
					size="md"
					icon={Undo2}
					disabled={pending}
					onClick={() =>
						onSubmit({ action: "lift", reasonDetail: note.trim() ? note.trim() : undefined })
					}
				>
					Levantar veto
				</Button>
			</div>
		</Modal>
	);
}
