"use client";

/**
 * features/cedula/ui/CedulaBatch.tsx
 * Mapea N view-models a N `CedulaSheet`, con salto de página entre cada uno
 * para que un solo Ctrl+P imprima todas (docs/PLAN-CEDULA-IMPRESA.md §3.2).
 * El salto va en el wrapper, no en el último elemento, para no dejar una
 * hoja en blanco extra al final al imprimir.
 */
import type { CedulaSheetVM } from "../lib/build-cedula-view-model";
import { CedulaSheet } from "./CedulaSheet";

export function CedulaBatch({ sheets }: { sheets: CedulaSheetVM[] }) {
	return (
		<div>
			{sheets.map((vm, i) => (
				<div key={vm.matchId} className={i < sheets.length - 1 ? "page-break" : undefined}>
					<CedulaSheet vm={vm} />
				</div>
			))}
			<style jsx>{`
				@media print {
					.page-break {
						page-break-after: always;
					}
				}
				@media screen {
					.page-break {
						margin-bottom: 24px;
					}
				}
			`}</style>
		</div>
	);
}
