"use client";

/**
 * features/discipline/ui/SuspensionsScreen.tsx
 * Tab "Suspensiones" (B7, §5.2 docs/MODULOS-GESTION-LIGA.md) — fiel al
 * mockup Suspensiones.html: tiles de resumen, filtros por estado/tipo, lista
 * de sanciones con badge de motivo + indicador de duración, y acciones de
 * escalar/levantar. El modal usa <Modal> centrado en vez del drawer lateral
 * del mockup (ver nota en SuspensionModal.tsx). Piezas de fila/tile/badge
 * compartidas con la vista global (B7b) en SuspensionListParts.tsx.
 */

import { useMemo, useState } from "react";
import { Ban, Clock, Gavel, ArrowUpCircle } from "lucide-react";
import { PageHeader, Button, Listbox, EmptyState } from "@/shared/ui";
import type { SuspensionDurationType, SuspensionStatus } from "@/entities/suspension";
import { useSuspensions, type SuspensionsData } from "../model/useSuspensions";
import { useCreateManualSuspension } from "../model/useCreateManualSuspension";
import { useEscalateSuspension } from "../model/useEscalateSuspension";
import { SuspensionModal, type SuspensionModalState } from "./SuspensionModal";
import { SummaryTile, EstadoChip, SuspensionRow } from "./SuspensionListParts";

type Props = {
	leagueId: string;
	leagueName: string;
	currentUserName: string;
	initialData: SuspensionsData;
};

const SEVERITY_RANK: Record<SuspensionDurationType, number> = { permanent: 0, time: 1, matches: 2 };
const STATUS_RANK: Record<SuspensionStatus, number> = { active: 0, served: 1, lifted: 2 };

const ESTADO_OPTIONS: { value: SuspensionStatus | "todos"; label: string }[] = [
	{ value: "active", label: "Activos" },
	{ value: "served", label: "Cumplidos" },
	{ value: "lifted", label: "Levantados" },
	{ value: "todos", label: "Todos" },
];

export function SuspensionsScreen({ leagueId, leagueName, currentUserName, initialData }: Props) {
	const { data } = useSuspensions(leagueId, initialData);
	const createMutation = useCreateManualSuspension(leagueId);
	const escalateMutation = useEscalateSuspension(leagueId);

	const [estado, setEstado] = useState<SuspensionStatus | "todos">("active");
	const [tipo, setTipo] = useState<SuspensionDurationType | "todos">("todos");
	const [modal, setModal] = useState<SuspensionModalState | null>(null);

	const suspensions = data.suspensions;

	const activos = suspensions.filter((s) => s.status === "active");
	const vetos = activos.filter((s) => s.durationType === "permanent").length;
	const porCumplirEstaJornada = activos.filter(
		(s) => s.durationType === "matches" && (s.matchesTotal ?? 0) - s.matchesServed === 1,
	).length;

	const filtered = useMemo(() => {
		return suspensions
			.filter((s) => estado === "todos" || s.status === estado)
			.filter((s) => tipo === "todos" || s.durationType === tipo)
			.sort(
				(a, b) =>
					STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
					SEVERITY_RANK[a.durationType] - SEVERITY_RANK[b.durationType],
			);
	}, [suspensions, estado, tipo]);

	function closeModal() {
		setModal(null);
	}

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				breadcrumb={[{ label: "TalachaStats" }, { label: leagueName }]}
				title="Suspensiones"
				subtitle="Jugadores sancionados y vetos de la liga"
				actions={
					<Button
						variant="secondary"
						size="md"
						icon={ArrowUpCircle}
						onClick={() => setModal({ mode: "new" })}
					>
						Registrar sanción
					</Button>
				}
			/>

			<section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<SummaryTile label="Suspendidos activos" value={activos.length} icon={Ban} />
				<SummaryTile label="Por cumplir esta jornada" value={porCumplirEstaJornada} icon={Clock} />
				<SummaryTile label="Vetos indefinidos" value={vetos} icon={Gavel} tone="danger" />
			</section>

			<section className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-3 justify-between">
					<div className="flex flex-wrap items-center gap-2">
						{ESTADO_OPTIONS.map((o) => (
							<EstadoChip
								key={o.value}
								active={estado === o.value}
								onClick={() => setEstado(o.value)}
							>
								{o.label}
							</EstadoChip>
						))}
					</div>
					<Listbox
						value={tipo}
						onChange={(v) => setTipo(v as SuspensionDurationType | "todos")}
						className="w-auto min-w-[190px]"
						options={[
							{ value: "todos", label: "Todos los tipos" },
							{ value: "matches", label: "Por partidos" },
							{ value: "time", label: "Por tiempo" },
							{ value: "permanent", label: "Veto indefinido" },
						]}
					/>
				</div>

				{filtered.length === 0 ? (
					<EmptyState
						icon={Ban}
						title="Ningún jugador suspendido"
						description="Cuando se registre una sanción o veto, aparecerá aquí."
					/>
				) : (
					<div className="flex flex-col gap-2">
						{filtered.map((s) => (
							<SuspensionRow
								key={s.id}
								s={s}
								onEscalate={() => setModal({ mode: "escalate", subject: s })}
								onLift={() => setModal({ mode: "lift", subject: s })}
							/>
						))}
					</div>
				)}
			</section>

			{modal && (
				<SuspensionModal
					modal={modal}
					roster={data.roster}
					currentUserName={currentUserName}
					onClose={closeModal}
					pending={createMutation.isPending || escalateMutation.isPending}
					onCreate={(_leagueId, input) => createMutation.mutate(input, { onSuccess: closeModal })}
					onEscalateOrLift={(input) => {
						if (modal.mode === "new") return;
						escalateMutation.mutate(
							{ suspensionId: modal.subject.id, input },
							{ onSuccess: closeModal },
						);
					}}
				/>
			)}
		</div>
	);
}
