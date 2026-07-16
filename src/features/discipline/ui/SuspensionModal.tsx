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
import { Modal, Field, Input, Button, Listbox } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type {
	CreateManualSuspensionInput,
	DisciplinePlayerSearchResult,
	EscalateSuspensionInput,
	SuspensionDurationUnit,
	SuspensionLeagueOption,
	SuspensionListItemDto,
	SuspensionRosterPlayer,
} from "@/entities/suspension";
import { addDurationIso, todayIso } from "../lib/add-duration";
import { fmtIsoDate } from "../lib/format-suspension";
import { GlobalPlayerLeaguePicker } from "./GlobalPlayerLeaguePicker";
import { PlayerAutocompleteField } from "./PlayerAutocompleteField";

export type SuspensionModalState =
	| { mode: "new" }
	| { mode: "escalate"; subject: SuspensionListItemDto }
	| { mode: "lift"; subject: SuspensionListItemDto };

type Props = {
	modal: SuspensionModalState;
	/** Vista por liga: id fijo — el picker de jugador busca dentro de esta liga. */
	leagueId?: string;
	/** Vista global (B7b): selector de liga — el picker busca en la liga elegida. */
	leagues?: SuspensionLeagueOption[];
	currentUserName: string;
	onClose: () => void;
	onCreate: (leagueId: string, input: CreateManualSuspensionInput) => void;
	onEscalateOrLift: (input: EscalateSuspensionInput) => void;
	pending: boolean;
};

export function SuspensionModal({
	modal,
	leagueId,
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
			fixedLeagueId={leagueId}
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
	fixedLeagueId,
	leagues,
	currentUserName,
	onClose,
	onCreate,
	onEscalate,
	pending,
}: {
	mode: "new" | "escalate";
	subject: SuspensionListItemDto | null;
	fixedLeagueId?: string;
	leagues?: SuspensionLeagueOption[];
	currentUserName: string;
	onClose: () => void;
	onCreate: (leagueId: string, input: CreateManualSuspensionInput) => void;
	onEscalate: (input: EscalateSuspensionInput) => void;
	pending: boolean;
}) {
	const isGlobal = mode === "new" && leagues !== undefined;

	const [type, setType] = useState<DurationChoice>(mode === "escalate" ? "time" : "matches");

	// Modo global (B7b): se busca al jugador primero (org/owner-wide) y la
	// liga se deriva de sus membresías SIN sanción activa — autoseleccionada
	// si solo hay una disponible, elegida a mano si hay varias. Las ligas ya
	// sancionadas nunca se auto-seleccionan ni se aceptan como elección (ver
	// GlobalPlayerLeaguePicker, que además las muestra deshabilitadas).
	const [globalSelectedPlayer, setGlobalSelectedPlayer] =
		useState<DisciplinePlayerSearchResult | null>(null);
	const [membershipLeagueId, setMembershipLeagueId] = useState<string | null>(null);
	const memberships = globalSelectedPlayer?.memberships ?? [];
	const availableMemberships = memberships.filter((m) => !m.hasActiveSuspension);
	const derivedLeagueId =
		availableMemberships.length === 1
			? availableMemberships[0].leagueId
			: (availableMemberships.find((m) => m.leagueId === membershipLeagueId)?.leagueId ?? "");

	function chooseGlobalPlayer(p: DisciplinePlayerSearchResult) {
		setGlobalSelectedPlayer(p);
		setMembershipLeagueId(null);
	}

	// Modo por liga fija (tab de una liga): roster de esa liga, sin selector.
	const [fixedSelectedPlayer, setFixedSelectedPlayer] = useState<SuspensionRosterPlayer | null>(
		null,
	);

	const leagueId = isGlobal ? derivedLeagueId : (fixedLeagueId ?? "");
	const globalPlayerId = isGlobal
		? (globalSelectedPlayer?.globalPlayerId ?? "")
		: (fixedSelectedPlayer?.globalPlayerId ?? "");

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
					<GlobalPlayerLeaguePicker
						selectedPlayer={globalSelectedPlayer}
						onSelectPlayer={chooseGlobalPlayer}
						leagueId={derivedLeagueId}
						onChooseLeague={setMembershipLeagueId}
					/>
				)}

				{mode === "new" && !isGlobal && (
					<Field label="Jugador" required>
						<PlayerAutocompleteField
							leagueId={fixedLeagueId ?? null}
							selected={fixedSelectedPlayer}
							onSelect={setFixedSelectedPlayer}
						/>
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
								<Listbox
									value={unit}
									onChange={(v) => setUnit(v as SuspensionDurationUnit)}
									options={[
										{ value: "days", label: "Días" },
										{ value: "weeks", label: "Semanas" },
										{ value: "months", label: "Meses" },
									]}
								/>
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
