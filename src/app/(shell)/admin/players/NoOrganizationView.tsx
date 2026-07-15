/**
 * app/admin/players/NoOrganizationView.tsx
 * Estado cuando el usuario organizador no tiene organización asignada.
 */

import { PageHeader } from "@/shared/ui/PageHeader";

export function NoOrganizationView() {
	return (
		<div className="space-y-6">
			<PageHeader title="Jugadores" />
			<div className="bg-surface border border-line rounded-lg p-10 text-center text-ink-3 text-sm">
				Tu cuenta no está asociada a ninguna organización. Contacta a un administrador.
			</div>
		</div>
	);
}
