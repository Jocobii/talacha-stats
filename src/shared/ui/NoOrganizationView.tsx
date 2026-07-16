/**
 * shared/ui/NoOrganizationView.tsx
 * Estado cuando el usuario organizador no tiene organización asignada.
 * Compartido entre todos los módulos "data-heavy" (jugadores, equipos, …)
 * — antes vivía duplicado por módulo, ver AGENTS.md §3.5 (no hardcoding disperso).
 */

import { PageHeader } from "./PageHeader";

export function NoOrganizationView({ title }: { title: string }) {
	return (
		<div className="space-y-6">
			<PageHeader title={title} />
			<div className="bg-surface border border-line rounded-lg p-10 text-center text-ink-3 text-sm">
				Tu cuenta no está asociada a ninguna organización. Contacta a un administrador.
			</div>
		</div>
	);
}
