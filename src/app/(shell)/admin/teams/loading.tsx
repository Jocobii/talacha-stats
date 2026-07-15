/**
 * app/admin/teams/loading.tsx
 *
 * Wrapper delgado sobre el skeleton genérico (shared/ui/ListSkeleton) —
 * Next.js lo muestra automáticamente mientras la page async resuelve sus
 * queries. Espejo de app/admin/players/loading.tsx.
 */

import { ListSkeleton } from "@/shared/ui/ListSkeleton";

export default function TeamsLoading() {
	return <ListSkeleton filterCount={2} columns={2} rows={8} />;
}
