"use client";

/**
 * features/discipline/ui/GlobalSuspensionsScreen.tsx
 * Vista global de suspensiones (B7b) — todas las ligas visibles para el
 * usuario en una sola pantalla, para el flujo "domingo en la noche, lista de
 * suspendidos de varias ligas" sin entrar liga por liga. Mismo look que el
 * tab por liga (SuspensionsScreen), reusando SuspensionListParts.tsx; agrega
 * un filtro de liga y muestra el nombre de la liga en cada fila.
 */

import { useMemo, useState } from "react";
import { Ban, Clock, Gavel, ArrowUpCircle } from "lucide-react";
import { PageHeader, Button, Select, EmptyState } from "@/shared/ui";
import type { SuspensionDurationType, SuspensionStatus } from "@/entities/suspension";
import { useAdminSuspensions, type AdminSuspensionsData } from "../model/useAdminSuspensions";
import { useCreateManualSuspensionGlobal } from "../model/useCreateManualSuspensionGlobal";
import { useEscalateSuspensionGlobal } from "../model/useEscalateSuspensionGlobal";
import { SuspensionModal, type SuspensionModalState } from "./SuspensionModal";
import { SummaryTile, EstadoChip, SuspensionRow } from "./SuspensionListParts";

type Props = {
	currentUserName: string;
	initialData: AdminSuspensionsData;
};

const SEVERITY_RANK: Record<SuspensionDurationType, number> = { permanent: 0, time: 1, matches: 2 };
const STATUS_RANK: Record<SuspensionStatus, number> = { active: 0, served: 1, lifted: 2 };

const ESTADO_OPTIONS: { value: SuspensionStatus | "todos"; label: string }[] = [
	{ value: "active", label: "Activos" },
	{ value: "served", label: "Cumplidos" },
	{ value: "lifted", label: "Levantados" },
	{ value: "todos", label: "Todos" },
];

export function GlobalSuspensionsScreen({ currentUserName, initialData }: Props) {
	const { data } = useAdminSuspensions(initialData);
	const createMutation = useCreateManualSuspensionGlobal();
	const escalateMutation = useEscalateSuspensionGlobal();

	const [estado, setEstado] = useState<SuspensionStatus | "todos">("active");
	const [tipo, setTipo] = useState<SuspensionDurationType | "todos">("todos");
	const [ligaId, setLigaId] = useState<string | "todas">("todas");
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
			.filter((s) => ligaId === "todas" || s.leagueId === ligaId)
			.sort(
				(a, b) =>
					STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
					SEVERITY_RANK[a.durationType] - SEVERITY_RANK[b.durationType],
			);
	}, [suspensions, estado, tipo, ligaId]);

	function closeModal() {
		setModal(null);
	}

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				breadcrumb={[{ label: "TalachaStats" }]}
				title="Suspensiones"
				subtitle="Jugadores sancionados y vetos — todas tus ligas"
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
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={ligaId}
							onChange={(e) => setLigaId(e.target.value)}
							className="!w-auto min-w-[190px]"
						>
							<option value="todas">Todas las ligas</option>
							{data.leagues.map((l) => (
								<option key={l.id} value={l.id}>
									{l.name}
								</option>
							))}
						</Select>
						<Select
							value={tipo}
							onChange={(e) => setTipo(e.target.value as SuspensionDurationType | "todos")}
							className="!w-auto min-w-[190px]"
						>
							<option value="todos">Todos los tipos</option>
							<option value="matches">Por partidos</option>
							<option value="time">Por tiempo</option>
							<option value="permanent">Veto indefinido</option>
						</Select>
					</div>
				</div>

				{filtered.length === 0 ? (
					<EmptyState
						icon={Ban}
						title="Ningún jugador suspendido"
						description="Cuando se registre una sanción o veto en cualquiera de tus ligas, aparecerá aquí."
					/>
				) : (
					<div className="flex flex-col gap-2">
						{filtered.map((s) => (
							<SuspensionRow
								key={s.id}
								s={s}
								leagueName={s.leagueName}
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
					leagues={data.leagues}
					currentUserName={currentUserName}
					onClose={closeModal}
					pending={createMutation.isPending || escalateMutation.isPending}
					onCreate={(leagueId, input) =>
						createMutation.mutate({ leagueId, input }, { onSuccess: closeModal })
					}
					onEscalateOrLift={(input) => {
						if (modal.mode === "new") return;
						escalateMutation.mutate(
							{ suspensionId: modal.subject.id, leagueId: modal.subject.leagueId, input },
							{ onSuccess: closeModal },
						);
					}}
				/>
			)}
		</div>
	);
}
