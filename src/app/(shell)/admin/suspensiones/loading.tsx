/**
 * app/admin/suspensiones/loading.tsx
 *
 * Wrapper delgado sobre el skeleton genérico (shared/ui/ListSkeleton) —
 * Next.js lo muestra automáticamente mientras la page async resuelve sus
 * queries. Espejo de app/admin/players/loading.tsx.
 */

import { ListSkeleton } from "@/shared/ui/ListSkeleton";

export default function SuspensionesLoading() {
	return <ListSkeleton filterCount={4} columns={6} rows={8} />;
}
