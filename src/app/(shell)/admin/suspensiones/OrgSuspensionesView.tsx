"use client";

/**
 * app/admin/suspensiones/OrgSuspensionesView.tsx
 *
 * Presentación de la vista organizador (FilterBar + chips + tabla + estados
 * vacío-sin-datos / vacío-por-filtros) — espejo de
 * app/admin/players/OrgPlayersView.tsx. Client Component (a diferencia del
 * espejo de jugadores/equipos) porque Escalar/Levantar/Registrar sanción
 * abren SuspensionModal y mutan vía TanStack Query; al terminar,
 * `router.refresh()` vuelve a correr la Server Component (page.tsx).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Inbox, Search as SearchIcon, ArrowUpCircle } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";
import { ActiveChip } from "@/shared/ui/filters";
// Import por ruta directa, NUNCA desde "@/features/discipline": ese barrel
// también re-exporta getOrgSuspensionsView (server-only, importa @/db vía
// entities/suspension/filters.ts). Si este Client Component importara desde
// el barrel, Next.js arrastraría "pg" al bundle del navegador — ver nota en
// features/discipline/index.ts.
import {
	SuspensionModal,
	type SuspensionModalState,
} from "@/features/discipline/ui/SuspensionModal";
import { useCreateManualSuspensionGlobal } from "@/features/discipline/model/useCreateManualSuspensionGlobal";
import { useEscalateSuspensionGlobal } from "@/features/discipline/model/useEscalateSuspensionGlobal";
import type { OrgSuspensionsView as OrgSuspensionsViewModel } from "@/features/discipline/lib/get-org-suspensions-view";
import { SuspensionesFilterBar } from "./SuspensionesFilterBar";
import { SuspensionesTable } from "./SuspensionesTable";

export function OrgSuspensionesView({
	rows,
	total,
	unfilteredTotal,
	filtersActive,
	leagueOptions,
	leagues,
	chips,
	countLabel,
	pagination,
	sort,
	currentUserName,
}: OrgSuspensionsViewModel & { currentUserName: string }) {
	const router = useRouter();
	const [modal, setModal] = useState<SuspensionModalState | null>(null);
	const createMutation = useCreateManualSuspensionGlobal();
	const escalateMutation = useEscalateSuspensionGlobal();

	const showEmptyNoData = rows.length === 0 && !filtersActive && unfilteredTotal === 0;
	const showEmptyFiltered = rows.length === 0 && filtersActive;

	function closeAndRefresh() {
		setModal(null);
		router.refresh();
	}

	const registrarButton = (
		<Button
			variant="secondary"
			size="md"
			icon={ArrowUpCircle}
			onClick={() => setModal({ mode: "new" })}
		>
			Registrar sanción
		</Button>
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Suspensiones"
				meta={
					total > 0 ? (
						<span className="font-mono text-[13px] text-ink-2">{countLabel}</span>
					) : undefined
				}
				actions={registrarButton}
			/>

			<div className="flex flex-col gap-3">
				<SuspensionesFilterBar leagueOptions={leagueOptions} />
				{chips.length > 0 && <ChipsRow chips={chips} />}
			</div>

			{showEmptyNoData ? (
				<EmptyState
					icon={Inbox}
					title="Aún no hay suspensiones en tu organización"
					description="Cuando se registre una sanción o veto, aparecerá aquí."
					action={registrarButton}
				/>
			) : showEmptyFiltered ? (
				<EmptyState
					icon={SearchIcon}
					title="No se encontraron resultados con estos filtros"
					description="Prueba a quitar alguno de los filtros activos."
					action={
						<Link
							href="/admin/suspensiones"
							className="h-9 px-4 inline-flex items-center rounded-md bg-surface-2 border border-line text-ink text-sm hover:border-ink-3 transition"
						>
							Limpiar filtros
						</Link>
					}
				/>
			) : (
				<SuspensionesTable
					rows={rows}
					pagination={pagination}
					emptyMessage="No se encontraron resultados con estos filtros."
					countLabel={countLabel}
					sort={sort}
					onEscalate={(s) => setModal({ mode: "escalate", subject: s })}
					onLift={(s) => setModal({ mode: "lift", subject: s })}
				/>
			)}

			{modal && (
				<SuspensionModal
					modal={modal}
					leagues={leagues}
					currentUserName={currentUserName}
					onClose={() => setModal(null)}
					pending={createMutation.isPending || escalateMutation.isPending}
					onCreate={(leagueId, input) =>
						createMutation.mutate({ leagueId, input }, { onSuccess: closeAndRefresh })
					}
					onEscalateOrLift={(input) => {
						if (modal.mode === "new") return;
						escalateMutation.mutate(
							{ suspensionId: modal.subject.id, leagueId: modal.subject.leagueId, input },
							{ onSuccess: closeAndRefresh },
						);
					}}
				/>
			)}
		</div>
	);
}

function ChipsRow({ chips }: { chips: OrgSuspensionsViewModel["chips"] }) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{chips.map((c) => (
				<ActiveChip key={c.key} label={c.label} href={c.href} />
			))}
			<Link
				href="/admin/suspensiones"
				className="text-[12px] text-ink-3 hover:text-ink underline decoration-dotted underline-offset-2"
			>
				Limpiar todo
			</Link>
		</div>
	);
}
