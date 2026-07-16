/**
 * app/admin/players/NoOrganizationView.tsx
 * Re-export del componente compartido (shared/ui/NoOrganizationView), curried
 * con el título de esta pantalla — evita duplicar el markup por módulo.
 */

import { NoOrganizationView as SharedNoOrganizationView } from "@/shared/ui/NoOrganizationView";

export function NoOrganizationView() {
	return <SharedNoOrganizationView title="Jugadores" />;
}
