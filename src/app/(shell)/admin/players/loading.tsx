/**
 * app/admin/players/loading.tsx
 *
 * Wrapper delgado sobre el skeleton genérico (shared/ui/ListSkeleton) —
 * Next.js lo muestra automáticamente mientras la page async resuelve sus
 * queries. Ver shared/ui/ListSkeleton.tsx para reusarlo en otros módulos.
 */

import { ListSkeleton } from "@/shared/ui/ListSkeleton";

export default function PlayersLoading() {
	return <ListSkeleton filterCount={4} columns={6} rows={8} />;
}
