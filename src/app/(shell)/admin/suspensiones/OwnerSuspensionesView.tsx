"use client";

/**
 * app/admin/suspensiones/OwnerSuspensionesView.tsx
 *
 * Presentación de la vista owner (todas las suspensiones, sin scope de
 * organización) — espejo de app/admin/players/OwnerPlayersView.tsx. A
 * diferencia de jugadores/equipos, esta vista sí necesita ser Client
 * Component: las acciones Escalar/Levantar/Registrar sanción abren
 * SuspensionModal y mutan vía TanStack Query (mismo modal y hooks que usaba
 * GlobalSuspensionsScreen); al terminar, `router.refresh()` vuelve a correr
 * la Server Component (page.tsx) para traer la página server-side actual.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search as SearchIcon, ArrowUpCircle } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
// Import por ruta directa, NUNCA desde "@/features/discipline": ese barrel
// también re-exporta getOwnerSuspensionsView (server-only, importa @/db vía
// entities/suspension/filters.ts). Si este Client Component importara desde
// el barrel, Next.js arrastraría "pg" al bundle del navegador — ver nota en
// features/discipline/index.ts.
import {
	SuspensionModal,
	type SuspensionModalState,
} from "@/features/discipline/ui/SuspensionModal";
import { useCreateManualSuspensionGlobal } from "@/features/discipline/model/useCreateManualSuspensionGlobal";
import { useEscalateSuspensionGlobal } from "@/features/discipline/model/useEscalateSuspensionGlobal";
import type { OwnerSuspensionsView as OwnerSuspensionsViewModel } from "@/features/discipline/lib/get-owner-suspensions-view";
import { SuspensionesTable } from "./SuspensionesTable";

export function OwnerSuspensionesView({
	rows,
	total,
	search,
	pagination,
	countLabel,
	leagues,
	currentUserName,
}: OwnerSuspensionsViewModel & { currentUserName: string }) {
	const router = useRouter();
	const [modal, setModal] = useState<SuspensionModalState | null>(null);
	const createMutation = useCreateManualSuspensionGlobal();
	const escalateMutation = useEscalateSuspensionGlobal();

	function closeAndRefresh() {
		setModal(null);
		router.refresh();
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Todas las suspensiones"
				meta={
					total > 0 ? (
						<span className="font-mono text-[13px] text-ink-2">{countLabel}</span>
					) : undefined
				}
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

			<form method="get" action="/admin/suspensiones" className="flex gap-2">
				<div className="relative flex-1 max-w-sm">
					<SearchIcon
						size={15}
						strokeWidth={1.75}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
					/>
					<input
						type="search"
						name="q"
						defaultValue={search}
						placeholder="Buscar jugador por nombre…"
						className="w-full h-9 rounded-md bg-surface-2 border border-line pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
					/>
				</div>
				<button
					type="submit"
					className="h-9 px-4 rounded-md bg-surface-2 border border-line text-ink-2 text-sm hover:bg-surface"
				>
					Buscar
				</button>
			</form>

			<SuspensionesTable
				rows={rows}
				pagination={pagination}
				emptyMessage={
					search
						? `No se encontraron suspensiones con "${search}".`
						: "No hay suspensiones registradas en el sistema."
				}
				countLabel={countLabel}
				onEscalate={(s) => setModal({ mode: "escalate", subject: s })}
				onLift={(s) => setModal({ mode: "lift", subject: s })}
			/>

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
