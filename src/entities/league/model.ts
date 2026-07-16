/**
 * entities/league/model.ts
 * Tipos del dominio Liga. El tipo de DB (`League`) se infiere con `$inferSelect`
 * (§4.1) y se re-exporta desde @/db — fuente única del contrato (§7.4). `app` y
 * `features` lo importan; nunca se re-declara el shape a mano en el callsite.
 */

import type { League, NewLeague } from "@/db";

export type { League, NewLeague };

/**
 * Lo mínimo para resolver `canManageLeague(user, ...)` desde una page — tipo
 * único, reusado por cualquier entidad que necesite resolver el permiso de
 * gestión a partir de "algo que cuelga de una liga" (un match, una jornada,
 * etc.), en vez de que cada una declare su propio shape idéntico. Mismo
 * patrón que `resolveHubOrg` en app/(shell)/admin/organizacion/resolve-org.ts:
 * la page llama a una función de entities/ y recibe un objeto tipado.
 */
export type LeaguePermissionContext = {
	leagueId: string;
	organizationId: string | null;
};
